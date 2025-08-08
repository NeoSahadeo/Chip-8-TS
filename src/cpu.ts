import type { Chip8Display } from "./canvas";

export interface CPU {
	memory: Uint8Array;
	graphics: Uint8Array;
	registers: Uint8Array;
	keys: Uint8Array;
	stack: Uint8Array;

	delay_timer: number;
	sound_timer: number;

	I: number;
	opcode: number;
	PC: number;
	SP: number;
	display: Chip8Display;
}

const inc_pc = (cpu: CPU) => (cpu.PC += 2);

export const initialize = (cpu: CPU) => {
	const fonts = [
		// 0
		0xf0, 0x90, 0x90, 0x90, 0xf0,
		// 1
		0x20, 0x60, 0x20, 0x20, 0x70,
		// 2
		0xf0, 0x10, 0xf0, 0x80, 0xf0,
		// 3
		0xf0, 0x10, 0xf0, 0x10, 0xf0,
		// 4
		0x90, 0x90, 0xf0, 0x10, 0x10,
		// 5
		0xf0, 0x80, 0xf0, 0x10, 0xf0,
		// 6
		0xf0, 0x80, 0xf0, 0x90, 0xf0,
		// 7
		0xf0, 0x10, 0x20, 0x40, 0x40,
		// 8
		0xf0, 0x90, 0xf0, 0x90, 0xf0,
		// 9
		0xf0, 0x90, 0xf0, 0x10, 0xf0,
		// A
		0xf0, 0x90, 0xf0, 0x90, 0x90,
		// B
		0xe0, 0x90, 0xe0, 0x90, 0xe0,
		// C
		0xf0, 0x80, 0x80, 0x80, 0xf0,
		// D
		0xe0, 0x90, 0x90, 0x90, 0xe0,
		// E
		0xf0, 0x80, 0xf0, 0x80, 0xf0,
		// F
		0xf0, 0x80, 0xf0, 0x80, 0x80,
	];

	for (let i = 0; i < 80; i++) {
		cpu.memory[i] = fonts[i];
	}
};

export const cycle = (cpu: CPU) => {
	cpu.opcode = (cpu.memory[cpu.PC] << 8) | cpu.memory[cpu.PC + 1];
	console.log(cpu.opcode.toString(16).padStart(4, "0"));

	switch (cpu.opcode >> 12) {
		case 0x0:
			if (cpu.opcode == 0x00e0) {
				cpu.graphics = new Uint8Array(64 * 32);
			} else if (cpu.opcode == 0x00ee) {
				cpu.SP--;
				cpu.PC = cpu.stack[cpu.SP];
			}
			inc_pc(cpu);
			break;
		case 0x1:
			cpu.PC = cpu.opcode & 0x0fff;
			break;
		case 0x2:
			cpu.stack[cpu.SP] = cpu.PC;
			cpu.SP++;
			cpu.PC = cpu.opcode & 0x0fff;
			break;
		case 0x3:
			if (cpu.registers[(cpu.opcode & 0x0f00) >> 8] == (cpu.opcode & 0x00ff)) {
				inc_pc(cpu);
			}
			inc_pc(cpu);
			break;
		case 0x4:
			if (cpu.registers[(cpu.opcode & 0x0f00) >> 8] != (cpu.opcode & 0x00ff)) {
				inc_pc(cpu);
			}
			inc_pc(cpu);
			break;
		case 0x5:
			if (
				cpu.registers[(cpu.opcode & 0x0f00) >> 8] ==
				cpu.registers[(cpu.opcode & 0x00f0) >> 4]
			) {
				inc_pc(cpu);
			}
			inc_pc(cpu);
			break;
		case 0x6:
			cpu.registers[(cpu.opcode & 0x0f00) >> 8] = cpu.opcode & 0x00ff;
			inc_pc(cpu);
			break;
		case 0x7:
			cpu.registers[(cpu.opcode & 0x0f00) >> 8] += cpu.opcode & 0x00ff;
			inc_pc(cpu);
			break;
		case 0x8:
			const x_index = (cpu.opcode & 0x0f00) >> 8;
			const y_index = (cpu.opcode & 0x0f00) >> 4;
			const mode = cpu.opcode & 0x000f;

			switch (mode) {
				case 0x0:
					cpu.registers[x_index] = cpu.registers[y_index];
					break;
				case 0x1:
					cpu.registers[x_index] |= cpu.registers[y_index];
					break;
				case 0x2:
					cpu.registers[x_index] &= cpu.registers[y_index];
					break;
				case 0x3:
					cpu.registers[x_index] ^= cpu.registers[y_index];
					break;
				case 0x4:
					const sum = cpu.registers[x_index] + cpu.registers[y_index];
					cpu.registers[0xf] = sum > 0xff ? 1 : 0;
					cpu.registers[x_index] = sum;
					break;
				case 0x5:
					cpu.registers[0xf] =
						cpu.registers[y_index] > cpu.registers[x_index] ? 0 : 1;
					cpu.registers[x_index] -= cpu.registers[y_index];
					break;
				case 0x6:
					cpu.registers[0xf] = cpu.registers[y_index] & 1;
					cpu.registers[x_index] >>= cpu.registers[y_index];
					break;
				case 0x7:
					cpu.registers[0xf] =
						cpu.registers[x_index] > cpu.registers[y_index] ? 0 : 1;
					cpu.registers[x_index] =
						cpu.registers[y_index] - cpu.registers[x_index];
					break;
				case 0xe:
					cpu.registers[0xf] = cpu.registers[y_index] >> 7;
					cpu.registers[x_index] <<= cpu.registers[y_index];
					break;
			}
			inc_pc(cpu);
			break;
		case 0x9:
			if (
				cpu.registers[(cpu.opcode & 0x0f00) >> 8] !=
				cpu.registers[(cpu.opcode & 0x00f0) >> 4]
			) {
				inc_pc(cpu);
			}
			inc_pc(cpu);
			break;
		case 0xa:
			cpu.I = cpu.opcode & 0x0fff;
			inc_pc(cpu);
			break;
		case 0xb:
			cpu.PC = (cpu.opcode & 0x0fff) + cpu.registers[0];
			break;
		case 0xc:
			cpu.registers[(cpu.opcode & 0x0f00) >> 8] =
				Math.floor(Math.random() * 256) & (cpu.opcode & 0x00ff);
			inc_pc(cpu);
			break;
		case 0xd:
			cpu.registers[0xf] = 0;
			const x_reg = cpu.registers[(cpu.opcode & 0x0f00) >> 8];
			const y_reg = cpu.registers[(cpu.opcode & 0x00f0) >> 4];
			const height = cpu.opcode & 0x000f;

			for (let p = 0; p < height; p++) {
				const pixel = cpu.memory[cpu.I + p];

				for (let q = 0; q < 8; q++) {
					if (pixel & (0x80 >> q)) {
						const ty = (y_reg + p) % 32;
						const tx = (x_reg + q) % 64;

						const idx = tx + ty * 64;
						cpu.graphics[idx] ^= 1;

						cpu.display.setPixel(tx, ty);

						if (!cpu.graphics[idx]) {
							cpu.registers[0xf] = 1;
						}
					}
				}
			}

			inc_pc(cpu);
			break;
		case 0xe: {
			const x_index = (cpu.opcode & 0x0f00) >> 8;
			const mode = cpu.opcode & 0x00ff;

			switch (mode) {
				case 0x9e:
					if (cpu.keys[cpu.registers[x_index]]) {
						inc_pc(cpu);
					}
					break;
				case 0xa1:
					if (!cpu.keys[cpu.registers[x_index]]) {
						inc_pc(cpu);
					}
					break;
			}
			inc_pc(cpu);
			break;
		}
		case 0xf: {
			const x_index = (cpu.opcode & 0x0f00) >> 8;
			const mode = cpu.opcode & 0x00ff;
			switch (mode) {
				case 0x07:
					cpu.registers[x_index] = cpu.delay_timer;
					break;
				case 0x0a:
					break;
				case 0x15:
					cpu.delay_timer = cpu.registers[x_index];
					break;
				case 0x18:
					cpu.sound_timer = cpu.registers[x_index];
					break;
				case 0x1e:
					{
						cpu.I += cpu.registers[x_index];
					}
					break;
				case 0x29:
					cpu.I = cpu.registers[x_index] * 5;
					break;
				case 0x33:
					cpu.memory[cpu.I] = cpu.registers[x_index] / 100;
					cpu.memory[cpu.I + 1] = (cpu.registers[x_index] / 10) % 10;
					cpu.memory[cpu.I + 2] = cpu.registers[x_index] % 10;
					break;
				case 0x55:
					for (let i = 0; i < x_index; i++) {
						cpu.memory[cpu.I + i] = cpu.registers[i];
					}
					break;
				case 0x65:
					for (let i = 0; i < x_index; i++) {
						cpu.registers[i] = cpu.memory[cpu.I + i];
					}
					break;
			}

			inc_pc(cpu);
			break;
		}
	}
};
