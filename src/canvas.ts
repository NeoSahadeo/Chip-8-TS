export class Chip8Display {
	cols: number;
	rows: number;
	scale: number;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	display: Uint8Array;

	constructor(scale: number) {
		this.cols = 64;
		this.rows = 32;
		this.scale = scale;

		const canvas = document.querySelector("canvas");
		if (canvas) canvas.remove();
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.cols * this.scale;
		this.canvas.height = this.rows * this.scale;
		document.body.appendChild(this.canvas);

		const ctx = this.canvas.getContext("2d");
		if (!ctx) throw new Error("Could not get canvas context");
		this.ctx = ctx;

		this.ctx.fillStyle = "#000"; // background color
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Mono display buffer: 64 * 32 pixels (0 or 1)
		this.display = new Uint8Array(this.cols * this.rows);
	}

	setPixel(x: number, y: number): boolean {
		if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
		const index = x + y * this.cols;
		this.display[index] ^= 1; // XOR pixel as per Chip-8 spec
		this.drawPixel(x, y, this.display[index]);
		return !this.display[index]; // Return true if pixel was erased (collision)
	}

	drawPixel(x: number, y: number, value: number): void {
		this.ctx.fillStyle = value ? "#FFF" : "#000";
		this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
	}

	draw(): void {
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				this.drawPixel(x, y, this.display[x + y * this.cols]);
			}
		}
	}

	updateDisplay(newDisplay: Uint8Array): void {
		if (newDisplay.length !== this.display.length) return;
		this.display.set(newDisplay);
		this.draw();
	}
}
