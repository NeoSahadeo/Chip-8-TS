const excepted_keys = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
];

export default class InputHandler {
	current_keypress: null | number = null;

	constructor() {
		document.addEventListener("keypress", this.keypress);
	}

	keypress(e: KeyboardEvent) {
		if (e.key in excepted_keys) {
			this.current_keypress = parseInt(e.key, 16);
		} else {
			this.current_keypress = null;
		}
	}

	get() {
		return this.current_keypress;
	}
}
