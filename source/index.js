const BitCodec = require("mtypes-bitcodec");

class PersistCodec {
	constructor() {
		this.obfu_mode = false;
		this.crc = false;
	}

	encode_array(a) {
		let njumps = 0;
		for (let i = 0; i < a.length; i++) {
			if (a[i] == null) njumps++;
			else {
				if (njumps > 0) {
					this.bc.write(2, 2);
					this.encode_int(njumps);
					njumps = 0;
				}
				this.bc.write(1, 0);
				this.do_encode(a[i]);
			}
		}
		this.bc.write(2, 3);
	}

	decode_array() {
		let a = [];
		a.pos = 0;
		this.cache.unshift(a);
		return a;
	}

	decode_array_item(a) {
		if (this.bc.read(1) == 0) {
			a[a.pos++] = this.do_decode();
		} else {
			if (this.bc.read(1) == 1) {
				return false;
			}
			a.pos += this.decode_int();
		}
		return true;
	}

	decode_array_fast() {
		let a = [],
			pos = 0;
		while (true) {
			if (this.bc.read(1) == 0) {
				a[pos++] = this.do_decode();
			} else {
				if (this.bc.read(1) == 1) break;
				pos += this.decode_int();
			}
			if (this.bc.error_flag) break;
		}
		return a;
	}

	encode_string(s) {
		let is_b64 = true,
			is_ascii = true;
		for (let i = 0; i < s.length; i++) {
			if (s.charCodeAt(i) > 127) {
				is_b64 = false;
				is_ascii = false;
				break;
			} else if (is_b64) {
				let c = s.charAt(i);
				if (this.bc.d64(c) == null) is_b64 = false;
			}
		}
		this.encode_int(s.length);
		if (is_b64) {
			this.bc.write(1, 0);
			for (let i = 0; i < s.length; i++) {
				this.bc.write(6, this.bc.d64(s.charAt(i)));
			}
		} else {
			this.bc.write(2, is_ascii ? 2 : 3);
			for (let i = 0; i < s.length; i++) {
				this.bc.write(is_ascii ? 7 : 8, s.charCodeAt(i));
			}
		}
	}

	decode_string() {
		let len = this.decode_int(),
			is_b64 = this.bc.read(1) == 0,
			s = "";
		if (is_b64) {
			for (let i = 0; i < len; i++) {
				s += this.bc.c64(this.bc.read(6));
			}
		} else {
			var is_ascii = this.bc.read(1) == 0;
			for (let i = 0; i < len; i++) {
				s += this.bc.chr(this.bc.read(is_ascii ? 7 : 8));
			}
		}
		return s;
	}

	encode_object(o) {
		for (let k in o) {
			this.encode_object_field(k, o[k]);
		}
		this.bc.write(2, 3);
	}

	decode_object() {
		let o = {};
		this.cache.unshift(o);
		return o;
	}

	decode_object_fast() {
		let o = {};
		while (true) {
			let k;
			if (this.bc.read(1) == 0) {
				k = this.fieldtbl[this.bc.read(this.nfields_bits)];
			} else {
				if (this.bc.read(1) == 1) break;
				k = this.decode_string();
				if (this.obfu_mode && k.charAt(0) != "$") k = "$" + k;
				this.fieldtbl[this.nfields++] = k;
				if (this.nfields >= this.next_field_bits) {
					this.nfields_bits++;
					this.next_field_bits *= 2;
				}
			}
			o[k] = this.do_decode();
			if (this.bc.error_flag) break;
		}
		return o;
	}

	encode_object_field(k, d) {
		if (typeof d != "function" && d != null) {
			if (this.obfu_mode && k.charAt(0) == "$") {
				k = k.slice(1);
			}
			if (this.fields[k] != null) {
				this.bc.write(1, 0);
				this.bc.write(this.nfields_bits, this.fields[k]);
			} else {
				this.fields[k] = this.nfields++;
				if (this.nfields >= this.next_field_bits) {
					this.nfields_bits++;
					this.next_field_bits *= 2;
				}
				this.bc.write(2, 2);
				this.encode_string(k);
			}
			this.do_encode(d);
		}
	}

	decode_object_field(o) {
		let k;
		if (this.bc.read(1) == 0) {
			k = this.fieldtbl[this.bc.read(this.nfields_bits)];
		} else {
			if (this.bc.read(1) == 1) return false;
			k = this.decode_string();
			if (this.obfu_mode && k.charAt(0) != "$") k = "$" + k;
			this.fieldtbl[this.nfields++] = k;
			if (this.nfields >= this.next_field_bits) {
				this.nfields_bits++;
				this.next_field_bits *= 2;
			}
		}
		o[k] = this.do_decode();
		return true;
	}

	encode_int(o) {
		if (o < 0) {
			this.bc.write(3, 7);
			this.encode_int(-o);
		} else if (o < 4) {
			this.bc.write(2, 0);
			this.bc.write(2, o);
		} else if (o < 16) {
			this.bc.write(2, 1);
			this.bc.write(4, o);
		} else if (o < 64) {
			this.bc.write(2, 2);
			this.bc.write(6, o);
		} else if (o < 65536) {
			this.bc.write(4, 12);
			this.bc.write(16, o);
		} else {
			this.bc.write(4, 13);
			this.bc.write(16, o & 0xffff);
			this.bc.write(16, (o >> 16) & 0xffff);
		}
	}

	decode_int() {
		let nbits = this.bc.read(2);
		if (nbits == 3) {
			// négatif
			if (this.bc.read(1) == 1) {
				return -this.decode_int();
			}
			// big int
			if (this.bc.read(1) == 1) {
				let n = this.bc.read(16),
					n2 = this.bc.read(16);
				return n | (n2 << 16);
			} else {
				return this.bc.read(16);
			}
		}
		return this.bc.read((nbits + 1) * 2);
	}

	encode_float(o) {
		let s = o.toString(),
			l = s.length;
		this.bc.write(5, l);
		for (let i = 0; i < l; i++) {
			var c = s.charCodeAt(i);
			if (c >= 48 && c <= 58) this.bc.write(4, c - 48); // 0 - 9
			else if (c == 46) this.bc.write(4, 10); // .
			else if (c == 43) this.bc.write(4, 11); // +
			else if (c == 45) this.bc.write(4, 12); // -
			else this.bc.write(4, 13); // e
		}
	}

	decode_float() {
		let l = this.bc.read(5),
			s = "";
		for (let i = 0; i < l; i++) {
			let k = this.bc.read(4);
			if (k < 10) k += 48; // 0 - 9
			else if (k == 10) k = 46; // .
			else if (k == 11) k = 43; // +
			else if (k == 12) k = 45; // -
			else k = 101; // e
			s += String.fromCharCode(k);
		}
		return parseFloat(s);
	}

	do_encode(o) {
		if (o == null) this.bc.write(4, 15);
		else if (o instanceof Array) {
			this.bc.write(3, 4);
			this.encode_array(o);
		} else {
			let type = typeof o;
			if (type == "string") {
				this.bc.write(4, 14);
				this.encode_string(o);
			} else if (type == "number") {
				if (Number.isNaN(o)) this.bc.write(4, 6);
				else if (o == Infinity) this.bc.write(5, 14);
				else if (o == -Infinity) this.bc.write(5, 15);
				else if (Math.round(o) == o) {
					this.bc.write(2, 0);
					this.encode_int(o);
				} else {
					this.bc.write(3, 2);
					this.encode_float(o);
				}
			} else if (type == "boolean") {
				if (o == true) this.bc.write(4, 13);
				else this.bc.write(4, 12);
			} else {
				this.bc.write(3, 5);
				this.encode_object(o);
			}
		}
		return true;
	}

	do_decode() {
		if (this.bc.read(1) == 0) {
			if (this.bc.read(1) == 1) {
				if (this.bc.read(1) == 1) {
					if (this.bc.read(1) == 1) {
						if (this.bc.read(1) == 1) {
							return -Infinity;
						}
						return Infinity;
					}
					return NaN;
				}
				return this.decode_float();
			}
			return this.decode_int();
		}
		if (this.bc.read(1) == 0) {
			if (this.bc.read(1) == 1) {
				return this.fast
					? this.decode_object_fast()
					: this.decode_object();
			} else {
				return this.fast
					? this.decode_array_fast()
					: this.decode_array();
			}
		}
		let tflag = this.bc.read(2);
		if (tflag == 0) return false;
		if (tflag == 1) return true;
		if (tflag == 2) return this.decode_string();
		return null;
	}

	encodeInit(o) {
		this.fast = false;
		this.bc = new BitCodec();
		this.fields = {};
		this.nfields = 0;
		this.next_field_bits = 1;
		this.nfields_bits = 0;
		this.cache = [];
		this.cache.push(o);
	}

	decodeInit(data) {
		this.fast = false;
		this.bc = new BitCodec();
		this.bc.setData(data);
		this.fieldtbl = [];
		this.nfields = 0;
		this.next_field_bits = 1;
		this.nfields_bits = 0;
		this.cache = [];
		this.result = null;
	}

	encodeLoop() {
		if (this.cache.length == 0) return true;
		this.do_encode(this.cache.shift());
		return false;
	}

	decodeLoop() {
		if (this.cache.length == 0) {
			this.result = this.do_decode();
		} else {
			let o = this.cache[0];
			if (o instanceof Array) {
				if (!this.decode_array_item(o)) {
					delete o["pos"];
					this.cache.shift();
				}
			} else {
				if (!this.decode_object_field(o)) {
					delete o["pos"];
					this.cache.shift();
				}
			}
		}
		if (this.bc.error_flag) {
			this.result = null;
			return false;
		}
		return this.cache.length != 0;
	}

	encodeEnd() {
		var s = this.bc.toString();
		if (this.crc) s += this.bc.crcStr();
		return s;
	}

	decodeEnd() {
		if (this.crc) {
			let s = this.bc.crcStr(),
				l = this.bc.in_pos,
				s2 = this.bc.data.slice(l, l + 4);
			if (s != s2) return null;
		}
		return this.result;
	}

	encode(o) {
		this.encodeInit(o);
		this.fast = true;
		var next = true;
		while (next) {
			next = this.encodeLoop();
		}
		return this.encodeEnd();
	}

	decode(data) {
		this.decodeInit(data);
		// this.fast = true;
		var next = true;
		while (next) {
			next = this.decodeLoop();
		}
		return this.decodeEnd();
	}

	progress() {
		return (this.bc.in_pos * 100) / this.bc.data.length;
	}
}

module.exports = PersistCodec;
