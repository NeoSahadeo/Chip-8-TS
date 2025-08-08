import { cycle, initialize, type CPU } from "./cpu";
import { Chip8Display } from "./canvas";

//load rom
const input = document.querySelector("#fileInput") as HTMLInputElement;
const reader = new FileReader();
let clock = 0;
let rom = "";

reader.onload = function(e) {
	if (!e) return;
	rom = "";
	const result = e.target!.result as ArrayBuffer;
	const bytes = new Uint8Array(result);
	for (let x = 0; x < bytes.length; x++) {
		const byte = bytes[x];
		let byte_string = byte.toString(16);
		if (byte_string.length < 2) {
			byte_string = "0" + byte_string;
		}
		rom += byte_string;
	}
	main();
};

reader.onerror = function(e) {
	console.error("File read error", e);
};

if (input) {
	input.addEventListener("change", () => {
		const file = input!.files![0];
		if (file) {
			reader.readAsArrayBuffer(file);
		}
	});
}
const main = () => {
	clearInterval(clock);

	const display = new Chip8Display(10);
	let cpu: CPU = {
		memory: new Uint8Array(4096),
		graphics: new Uint8Array(64 * 32),
		registers: new Uint8Array(16),
		keys: new Uint8Array(16),
		stack: new Uint8Array(16),

		PC: 0x200,
		delay_timer: 0,
		sound_timer: 0,
		opcode: 0,
		I: 0,
		SP: 0,
		display: display,
	} as any;
	initialize(cpu);

	for (let i = 0; i < rom.length; i += 2) {
		const hexByte = rom.substr(i, 2); // get each pair of hex chars
		cpu.memory[0x200 + i / 2] = parseInt(hexByte, 16); // parse hex byte and store
	}
	console.log(rom);
	clock = setInterval(() => {
		cycle(cpu);
		display.updateDisplay(cpu.graphics);
	}, 16);
};
