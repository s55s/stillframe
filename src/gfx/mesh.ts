export const VERTEX_FLOATS = 10;
export const VERTEX_STRIDE = VERTEX_FLOATS * 4;
export const STATIC_VERTEX_LAYOUT = {
  arrayStride: VERTEX_STRIDE,
  attributes: [
    { shaderLocation: 0, offset: 0, format: "float32x3" },
    { shaderLocation: 1, offset: 12, format: "float32x3" },
    { shaderLocation: 2, offset: 24, format: "float32x4" }
  ]
};
export let nextMeshId = 1;
export class Mesh {
  id = nextMeshId++;
  vertexBuffer;
  indexBuffer;
  indexCount;
  constructor(device, vertices, indices, label = "mesh") {
    this.indexCount = indices.length;
    this.vertexBuffer = createBufferWithData(device, vertices, GPUBufferUsage.VERTEX, `${label}-vb`);
    this.indexBuffer = createBufferWithData(device, indices, GPUBufferUsage.INDEX, `${label}-ib`);
  }
  destroy() {
    this.vertexBuffer.destroy();
    this.indexBuffer.destroy();
  }
};
export function createBufferWithData(device, data, usage, label) {
  const buffer = device.createBuffer({ label, size: Math.max(4, data.byteLength), usage, mappedAtCreation: true });
  const Ctor = data instanceof Float32Array ? Float32Array : Uint32Array;
  new Ctor(buffer.getMappedRange()).set(data);
  buffer.unmap();
  return buffer;
}
