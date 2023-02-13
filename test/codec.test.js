const PersistCodec = require("../source/index");

/******************************************************************************
 * Encoding                                                                   *
 ******************************************************************************/

test("encode string", function () {
	let result = new PersistCodec().encode("Hello World!");
	expect(result).toStrictEqual("5YKzDMZEGR7-wZiH");
});

// prettier-ignore
test("encode number", function () {
	let tiny_int     = new PersistCodec().encode(2),
		small_int    = new PersistCodec().encode(14),
		int          = new PersistCodec().encode(62),
		negative_int = new PersistCodec().encode(-62),
		medium_int   = new PersistCodec().encode(65534),
		big_int      = new PersistCodec().encode(999999);

	expect(tiny_int    ).toStrictEqual("c");
	expect(small_int   ).toStrictEqual("hG");
	expect(int         ).toStrictEqual("l4");
	expect(negative_int).toStrictEqual("pFa");
	expect(medium_int  ).toStrictEqual("m__4");
	expect(big_int     ).toStrictEqual("nqJ8adW");
});

test("encode array", function () {
	let result = new PersistCodec().encode([1, 2, 3, "4", 5, 6, 7, "8", "9"]);
	expect(result).toStrictEqual("GeedClGkHylUf44xU");
});

test("encode object", function () {
	let result = new PersistCodec().encode({
		foo: "FOO",
		bar: [1, "2", 3],
		baz: -9999,
	});
	expect(result).toStrictEqual("Syu47Jp0urGqeybClyhXGqgt4tH-");
});

/******************************************************************************
 * Decoding                                                                   *
 ******************************************************************************/

test("decode string", function () {
	let result = new PersistCodec().decode("5YKzDMZEGR7-wZiH");
	expect(result).toStrictEqual("Hello World!");
});

// prettier-ignore
test("decode number", function () {
	let tiny_int     = new PersistCodec().decode("c"),
		small_int    = new PersistCodec().decode("hG"),
		int          = new PersistCodec().decode("l4"),
		negative_int = new PersistCodec().decode("pFa"),
		medium_int   = new PersistCodec().decode("m__4"),
		big_int      = new PersistCodec().decode("nqJ8adW");

	expect(tiny_int    ).toStrictEqual(2);
	expect(small_int   ).toStrictEqual(14);
	expect(int         ).toStrictEqual(62);
	expect(negative_int).toStrictEqual(-62);
	expect(medium_int  ).toStrictEqual(65534);
	expect(big_int     ).toStrictEqual(999999);
});

test("decode array", function () {
	let result = new PersistCodec().decode("GeedClGkHylUf44xU");
	expect(result).toStrictEqual([1, 2, 3, "4", 5, 6, 7, "8", "9"]);
});

test("decode object", function () {
	let result = new PersistCodec().decode("Syu47Jp0urGqeybClyhXGqgt4tH-");
	expect(result).toStrictEqual({
		foo: "FOO",
		bar: [1, "2", 3],
		baz: -9999,
	});
});
