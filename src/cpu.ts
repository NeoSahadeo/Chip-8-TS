import type CanvasX from "./canvas";
import type InputHandler from "./input";
import type MMU from "./mmu";

export default class CPU {
	// Display
	CANVASX: CanvasX;

	// MSC Memory
	STACK: Array<number>;
	MMU: MMU;

	// Special Registers
	I: number;
	PC: number;
	SP: number;

	// Timer Registers
	DELAY_REG: number;
	SOUND_REG: number;

	// General Purpose Registers
	V: Uint8Array;

	// Input
	INPUT_HANDLER: InputHandler;

	constructor(mmu: MMU, canavsx: CanvasX, input_handler: InputHandler) {
		this.CANVASX = canavsx;

		this.STACK = [];
		this.MMU = mmu;

		this.PC = 0x200;
		this.I = 0;
		this.SP = 0;
		this.DELAY_REG = 0;
		this.SOUND_REG = 0;

		this.V = new Uint8Array(16);

		this.INPUT_HANDLER = input_handler;
	}

	execute(instruction: number) {
		switch ((instruction & 0xf000) >> 12) {
			case 0:
				this.CANVASX.clear();
				break;
			case 1:
				this.PC = instruction & 0x0fff;
				break;
			case 2:
				this.STACK[this.SP] = this.PC;
				this.SP++;
				this.PC = instruction & 0x0fff;
				break;
			case 3:
				if (this.V[(instruction & 0x0f00) >> 8] != (instruction & 0x00ff)) {
					this.PC += 2;
				}
				break;
			case 4:
				if (this.V[(instruction & 0x0f00) >> 8] == (instruction & 0x00ff)) {
					this.PC += 2;
				}
				break;
			case 5:
				if (
					this.V[(instruction & 0x0f00) >> 8] ==
					this.V[(instruction & 0x00f0) >> 4]
				) {
					this.PC += 2;
				}
				break;
			case 6:
				this.V[(instruction & 0x0f00) >> 8] = instruction & 0x00ff;
				break;
			case 7:
				const sum =
					(this.V[(instruction & 0x0f00) >> 8] + instruction) & 0x00ff;
				this.V[(instruction & 0x0f00) >> 8] = sum & 0xff;
				break;
			case 8:
				switch (instruction & 0x000f) {
					case 0:
						this.V[(instruction & 0x0f00) >> 8] =
							this.V[(instruction & 0x00f0) >> 4];
						break;
					case 1:
						this.V[(instruction & 0x0f00) >> 8] |=
							this.V[(instruction & 0x00f0) >> 4];
						break;
					case 2:
						this.V[(instruction & 0x0f00) >> 8] &=
							this.V[(instruction & 0x00f0) >> 4];
						break;
					case 3:
						this.V[(instruction & 0x0f00) >> 8] ^=
							this.V[(instruction & 0x00f0) >> 4];
						break;
					case 4:
						const sum =
							this.V[(instruction & 0x0f00) >> 8] +
							this.V[(instruction & 0x00f0) >> 4];
						if (sum > 0xff) {
							this.V[0xf] = 0x01;
							this.V[(instruction & 0x0f00) >> 8] = sum & 0xff;
						} else {
							this.V[0xf] = 0x00;
						}
						break;
					case 5:
						this.V[0x0f] =
							this.V[(instruction & 0x0f00) >> 8] >=
								this.V[(instruction & 0x00f0) >> 4]
								? 0x01
								: 0x00;
						this.V[(instruction & 0x0f00) >> 8] =
							(this.V[(instruction & 0x0f00) >> 8] -
								this.V[(instruction & 0x00f0) >> 4]) &
							0xff;
						break;
					case 6:
						this.V[0xf] = this.V[(instruction & 0x00f0) >> 4] & 0xf;
						this.V[(instruction & 0x0f00) >> 8] =
							this.V[(instruction & 0x00f0) >> 4] >> 1;
						break;
					case 7:
						this.V[0x0f] =
							this.V[(instruction & 0x00f0) >> 4] >=
								this.V[(instruction & 0x0f00) >> 8]
								? 0x01
								: 0x00;
						this.V[(instruction & 0x0f00) >> 8] =
							this.V[(instruction & 0x0f00) >> 8] -
							this.V[(instruction & 0x00f0) >> 4];
						break;
					case 0xe:
						this.V[0xf] = (this.V[(instruction & 0x00f0) >> 4] & 0xf0) >> 4;
						this.V[(instruction & 0x0f00) >> 8] =
							this.V[(instruction & 0x00f0) >> 4] << 1 && 0xff;
						break;
				}
				break;
			case 9:
				switch (instruction & 0x000f) {
					case 0:
						if (
							this.V[(instruction & 0x0f00) >> 8] !=
							this.V[(instruction & 0x00f0) >> 4]
						) {
							this.PC += 2;
						}
				}
				break;
			case 0xa:
				this.I = instruction & 0x0fff;
				break;
			case 0xb:
				this.PC = (instruction & 0x0fff) + this.V[0];
				break;
			case 0xc:
				const random_number = Math.floor(Math.random() * 4096);
				this.V[(instruction & 0x0f00) >> 8] =
					random_number & (instruction & 0x00ff);
				break;
			case 0xd:
				let x = this.V[(instruction & 0x0f00) >> 8] & 63;
				let y = this.V[(instruction & 0x00f0) >> 4] & 31;
				const n = instruction & 0x000f; // This is the height, not a V register
				this.V[0xf] = 0;
				for (let row = 0; row < n; row++) {
					const byte = this.MMU.get(this.I + row);
					for (let p = 0; p < 8; p++) {
						const pixel = (byte >> (7 - p)) & 1;
						const px = (x + p) % 64;
						const py = (y + row) % 32;
						if (pixel) {
							if (this.CANVASX.get(px, py)) this.V[0xf] = 1; // Pixel will flip off
							// XOR the pixel
							this.CANVASX.set(px, py, this.CANVASX.get(px, py) ^ 1);
						}
					}
				}
				break;
			case 0xe:
				switch (instruction & 0x00ff) {
					case 0x9e:
						if (
							this.V[(instruction & 0x0f00) >> 8] == this.INPUT_HANDLER.get()
						) {
							this.PC += 2;
						}
						break;
					case 0xa1:
						if (
							this.V[(instruction & 0x0f00) >> 8] != this.INPUT_HANDLER.get()
						) {
							this.PC += 2;
						}
						break;
				}
				break;
			case 0xf:
				switch (instruction & 0x00ff) {
					case 0x07:
						this.V[(instruction & 0x0f00) >> 8] = this.DELAY_REG;
						break;
					case 0x0a:
						const value = this.INPUT_HANDLER.get();
						if (value == null) {
							this.PC--;
						} else {
							this.V[(instruction & 0x0f00) >> 8] = value;
						}
						break;
					case 0x15:
						this.DELAY_REG = this.V[(instruction & 0x0f00) >> 8];
						break;
					case 0x18:
						this.SOUND_REG = this.V[(instruction & 0x0f00) >> 8];
						break;
					case 0x1e:
						this.I = (this.V[(instruction & 0x0f00) >> 8] + this.I) & 0xffff;
						break;
					case 0x29:
						this.I = 0x50 + this.V[(instruction & 0x0f00) >> 8] * 5;
						break;
					case 0x33:
						const x = this.V[(instruction & 0x0f00) >> 8];
						this.MMU.set(this.I, Math.floor(x / 100) % 10);
						this.MMU.set(this.I + 1, Math.floor(x / 10) % 10);
						this.MMU.set(this.I + 2, x % 10);
						break;
					case 0x55:
						for (let x = 0; x < this.V[(instruction & 0x0f00) >> 8]; x++) {
							this.MMU.set(this.I + x, this.V[x]);
						}
						break;
					case 0x65:
						for (let x = 0; x < this.V[(instruction & 0x0f00) >> 8]; x++) {
							this.V[x] = this.MMU.get(this.I + x);
						}
						break;
				}
				break;
		}
	}
}
