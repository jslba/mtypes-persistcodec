# [PersistCodec][index] implement of PersistCodec

![npm](https://img.shields.io/npm/v/mtypes-persistcodec?color=blue&style=flat)
![tests](https://img.shields.io/static/v1?label=tests&message=8%20passed&color=brightgreen&style=flat)
![GitHub](https://img.shields.io/github/license/jslba/mtypes-persistcodec?style=flat)

The class can be used to `.encode` values and objects into a String or `.decode`
values and objects from a String.   
It's a class initially used in some [Motion Twin][1] projects ; that was written
in [Motion Types][mtypes] a programing  language developped by [Nicolas Cannasse
][ncannasse] at [Motion Twin][1] in 2004-2005.

> **Note**   
> If you are looking  for how to  use it, you  can look at some  examples in the
> [unit tests][unittests].

## Constructor

```hx
new PersistCodec()
```

## Variables

```hx
public next_field_bits: Int
```

```hx
public nfields_bits: Int
```

```hx
public obfu_mode: Bool
```

```hx
public fieldtbl: Array
```

```hx
public nfields: Int
```

```hx
public fields: Object
```

```hx
public result: Mixed
```

```hx
public cache: Array
```

```hx
public fast: Bool
```

```hx
public crc: Bool
```

```hx
public bc: BitCodec
```

## Methods

```hx
public encode_array(a: Array): void
```

```hx
public decode_array(): Array
```

```hx
public decode_array_item(a: Array): Bool
```

```hx
public decode_array_fast(): Array
```

```hx
public encode_string(s: String): void
```

```hx
public decode_string(): String
```

```hx
public encode_object(o: Object): void
```

```hx
public decode_object(): Object
```

```hx
public decode_object_fast(): Object
```

```hx
public encode_object_field(k: String, d: Mixed): void
```

```hx
public decode_object_field(o: Mixed): Bool
```

```hx
public encode_int(o: Int): void
```

```hx
public decode_int(): Int
```

```hx
public encode_float(o: Float): void
```

```hx
public decode_float(): Float
```

```hx
public do_encode(o: Mixed): Bool
```

```hx
public do_decode(): Mixed
```

```hx
public encodeInit(o: Mixed): void
```

```hx
public decodeInit(data: String): void
```

```hx
public encodeLoop(): Bool
```

```hx
public decodeLoop(): Bool
```

```hx
public encodeEnd(): String
```

```hx
public decodeEnd(): Mixed
```

```hx
public encode(o: Mixed): String
```

```hx
public decode(data: String): Mixed
```

```hx
public progress(): Float
```

[1]: https://motion-twin.com/fr/
[index]: /source/index.js
[mtypes]: https://github.com/motion-twin/mtypes
[ncannasse]: https://github.com/ncannasse
[unittests]: /test/codec.test.js