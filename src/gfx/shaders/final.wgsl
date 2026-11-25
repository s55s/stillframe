@group(0) @binding(0) var<uniform> post : PostUniforms;
@group(0) @binding(1) var compTex : texture_2d<f32>;
@group(0) @binding(2) var bloomTex : texture_2d<f32>;
@group(0) @binding(3) var normalTex : texture_2d<f32>;
@group(0) @binding(4) var linearSampler : sampler;

fn aces(x : vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3f(0.0), vec3f(1.0));
}

// PCG integer hash. It works on whole pixel coordinates and a frame counter, so it
// stays uniform however long the game runs. The previous float hash was fed growing
// time values, lost precision, and collapsed into flat blotches after a few minutes.
fn pcg(v : u32) -> u32 {
  let s = v * 747796405u + 2891336453u;
  let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}

// Uniform noise in [0, 1) for one pixel in one frame.
fn grainNoise(pixel : vec2f, time : f32) -> f32 {
  let frame = u32(time * 60.0);
  let h = pcg(u32(pixel.x) + pcg(u32(pixel.y) + pcg(frame)));
  return f32(h) / 4294967296.0;
}

@fragment
fn fsFinal(fin : FullOut) -> @location(0) vec4f {
  let uv = fin.uv;
  let centered = uv - vec2f(0.5);
  let radial = dot(centered, centered);

  let ca = post.grade.z * radial;
  let offs = centered * ca;
  var color = vec3f(
    textureSampleLevel(compTex, linearSampler, uv + offs, 0.0).r,
    textureSampleLevel(compTex, linearSampler, uv, 0.0).g,
    textureSampleLevel(compTex, linearSampler, uv - offs, 0.0).b,
  );

  color += textureSampleLevel(bloomTex, linearSampler, uv, 0.0).rgb * post.fx.y;
  color *= post.fx.z;

  let dims = vec2f(textureDimensions(normalTex));
  let mask = textureLoad(normalTex, vec2i(uv * dims), 0).w;
  let isEnemy = select(0.0, 1.0, mask > 0.75);

  let luma = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  let desat = post.grade.y * (1.0 - isEnemy);
  color = mix(color, vec3f(luma) * vec3f(0.92, 0.97, 1.05), desat);

  color = mix(color, post.flash.rgb, post.flash.a);

  var mapped = aces(color);

  let edge = smoothstep(0.15, 0.7, radial * 1.6);
  let vig = 1.0 - post.fx.x * edge;
  mapped *= vig;

  // Threat warning (danger.x = threat 0..1, danger.y = pulse rate in rad/s): the screen
  // edges throb darker while an enemy is aiming or a bullet is close. It only touches the
  // edges and never goes past THREAT_MAX_DARKEN, so the centre of the view (where the
  // danger is) always stays visible.
  let THREAT_MAX_DARKEN = 0.5;
  let pulse = 0.5 + 0.5 * sin(post.camera.z * post.danger.y);
  mapped *= 1.0 - post.danger.x * edge * THREAT_MAX_DARKEN * (0.5 + 0.5 * pulse);

  var encoded = pow(clamp(mapped, vec3f(0.0), vec3f(1.0)), vec3f(1.0 / 2.2));

  // Film grain is added after gamma encoding, so it's equally strong in dark and bright
  // areas. Added before encoding, the pow() above amplified it several times in
  // near-black areas, which make up most of this game's image.
  let g = grainNoise(fin.clipPos.xy, post.camera.z) - 0.5;
  encoded = clamp(encoded + vec3f(g * post.grade.w), vec3f(0.0), vec3f(1.0));
  return vec4f(encoded, 1.0);
}
