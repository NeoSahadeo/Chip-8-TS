export default class CanvasX {
	pixels: Uint8Array[];
	context: CanvasRenderingContext2D;

	pixel_width: number;
	pixel_height: number;

	constructor(canvas: HTMLCanvasElement) {
		this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
		this.pixels = new Uint8Array(64) as any;
		for (let x = 0; x < 64; x++) {
			this.pixels[x] = new Uint8Array(32);
		}
		this.pixel_width = canvas.width / 64;
		this.pixel_height = canvas.height / 32;
		this.context.fillStyle = "black";

		if (!this.context) {
			console.error("Failed to create context");
			return;
		}
	}

	set(x: number, y: number, value: number) {
		console.log("updating");
		this.pixels[x][y] = value;
		this.draw_pixel(x, y, value);
	}
	get(x: number, y: number) {
		console.log("123");
		return this.pixels[x][y];
	}
	draw_pixel(x: number, y: number, value: number) {
		this.context.fillStyle = value ? "#000" : "#fff";
		this.context.fillRect(
			x * this.pixel_width,
			y * this.pixel_height,
			this.pixel_width,
			this.pixel_height,
		);
	}
	clear() {
		this.context.clearRect(0, 0, 64, 32);
	}
}
