/**
 * Cosmic particles — a GPU particle system in 3D.
 *
 * State lives in float textures (position+life, velocity+seed), updated every
 * frame by a fragment shader (ping-pong, MRT). Particles drift through a 3D
 * curl-noise flow field around a spherical shell, swirl around the axis and
 * burst outward on kicks. They are drawn as 1-px lines from the previous to the
 * current position (hair-thin "capillary" streaks) with additive blending and a
 * slowly orbiting perspective camera; particles behind the centre disc (the eye
 * / image) are dimmed so the cloud reads as wrapping around it in 3D.
 */

const UPDATE_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform float uDt;
uniform float uTime;
uniform float uSpeed;
uniform float uTurb;
uniform float uRadius;
uniform float uSwirl;
uniform float uBurst;
uniform float uPulse;
in vec2 vUv;
layout(location=0) out vec4 oPos;
layout(location=1) out vec4 oVel;

float h31(vec3 p){ p = fract(p*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float n3(vec3 p){
  vec3 i = floor(p), f = fract(p); vec3 u = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), u.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), u.x), u.y),
             mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), u.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), u.x), u.y), u.z);
}
vec3 field(vec3 p){ return vec3(n3(p), n3(p + vec3(31.4, 7.7, 13.1)), n3(p + vec3(-17.3, 47.1, 5.9))); }
vec3 curl(vec3 p){
  const float e = 0.08;
  vec3 dx = (field(p + vec3(e,0,0)) - field(p - vec3(e,0,0)))/(2.0*e);
  vec3 dy = (field(p + vec3(0,e,0)) - field(p - vec3(0,e,0)))/(2.0*e);
  vec3 dz = (field(p + vec3(0,0,e)) - field(p - vec3(0,0,e)))/(2.0*e);
  return vec3(dy.z - dz.y, dz.x - dx.z, dx.y - dy.x);
}
vec3 randDir(vec3 s){
  float z = h31(s)*2.0 - 1.0;
  float a = h31(s + 7.3)*6.2831853;
  float r = sqrt(max(0.0, 1.0 - z*z));
  return vec3(r*cos(a), r*sin(a), z);
}

void main(){
  vec4 P = texture(uPos, vUv);
  vec4 V = texture(uVel, vUv);
  vec3 p = P.xyz; vec3 v = V.xyz; float life = P.w; float seed = V.w;

  float sc = mix(0.6, 3.5, uTurb);
  vec3 flow = curl(p*sc + vec3(0.0, uTime*0.05, uTime*0.03))*mix(0.05, 0.9, uSpeed);
  float r = length(p) + 1e-4;
  vec3 n = p/r;
  float R = uRadius*(0.85 + 0.3*fract(seed*7.13));           // each particle has its own shell
  vec3 spring = n*(R - r)*0.9;                               // pulled back to its shell
  vec3 swirl = cross(vec3(0.0, 1.0, 0.0), p)*uSwirl*0.6;
  vec3 target = flow + spring + swirl;
  v = mix(v, target, 1.0 - exp(-uDt*3.0));
  v += n*uPulse*uBurst*uDt*6.0;                              // kick burst
  p += v*uDt;
  life -= uDt*mix(0.04, 0.12, fract(seed*3.7));

  if(life <= 0.0 || r > uRadius*3.0){
    vec3 s = vec3(seed, uTime, life*13.0);
    p = randDir(s)*uRadius*(0.9 + 0.2*h31(s + 3.1));
    v = vec3(0.0);
    life = 1.0;
  }
  oPos = vec4(p, life);
  oVel = vec4(v, seed);
}`;

const DRAW_VERT = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform int uW;
uniform mat4 uVP;
uniform float uTrail;
uniform float uAmount;
uniform float uWarm;
uniform float uDiscR;   // centre disc radius in NDC-y units (0 = none)
uniform float uAspect;
out vec4 vCol;
void main(){
  int id = gl_VertexID/2;
  int end = gl_VertexID - id*2;
  ivec2 tc = ivec2(id % uW, id / uW);
  vec4 P = texelFetch(uPos, tc, 0);
  vec4 V = texelFetch(uVel, tc, 0);
  vec3 p = P.xyz - (end == 0 ? V.xyz*mix(0.02, 0.6, uTrail) : vec3(0.0));
  vec4 clip = uVP*vec4(p, 1.0);
  gl_Position = clip;

  float speed = length(V.xyz);
  float seed = V.w;
  // palette: violet → electric blue → cyan, with warm embers near the core
  vec3 c = mix(vec3(0.45,0.25,1.0), vec3(0.2,0.5,1.0), fract(seed*5.3));
  c = mix(c, vec3(0.45,0.95,1.0), clamp(speed*0.9, 0.0, 0.7));
  c = mix(c, vec3(1.0,0.62,0.3), uWarm*smoothstep(1.0, 0.6, length(P.xyz))*fract(seed*11.0));
  float life = P.w;
  float a = smoothstep(0.0, 0.15, life)*smoothstep(1.0, 0.92, life);
  a *= (end == 0) ? 0.0 : 1.0;                                    // tail fades to nothing
  a *= 0.35 + 0.65*fract(seed*17.0);
  // behind the centre disc → mostly hidden (3D wrap-around)
  vec2 ndc = clip.xy/clip.w;
  float inDisc = smoothstep(uDiscR, uDiscR*0.92, length(vec2(ndc.x*uAspect, ndc.y)));
  float behind = step(3.2, clip.w);                               // farther than the centre
  a *= 1.0 - 0.9*inDisc*behind*step(0.001, uDiscR);
  vCol = vec4(c*a*uAmount*0.45, 1.0);
}`;

const DRAW_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec4 vCol;
out vec4 fragColor;
void main(){ fragColor = vCol; }`;

const VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;

interface State {
  pos: WebGLTexture;
  vel: WebGLTexture;
  fb: WebGLFramebuffer;
}

export interface ParticleDraw {
  params: Record<string, number>;
  /** centre disc radius in screen-height units (eye / image), 0 for none */
  disc: number;
}

export class CosmicParticles {
  private gl: WebGL2RenderingContext;
  private upd: WebGLProgram;
  private draw: WebGLProgram;
  private uU: Record<string, WebGLUniformLocation | null> = {};
  private uD: Record<string, WebGLUniformLocation | null> = {};
  private s: State[] = [];
  private idx = 0;
  private w = 0;
  private emptyVao: WebGLVertexArrayObject;
  private quadVao: WebGLVertexArrayObject;
  private lastTime = -1;
  private orbit = 0;
  readonly ok: boolean;

  constructor(gl: WebGL2RenderingContext, quadVao: WebGLVertexArrayObject, compile: (v: string, f: string) => WebGLProgram) {
    this.gl = gl;
    this.quadVao = quadVao;
    this.emptyVao = gl.createVertexArray()!;
    this.ok = !!gl.getExtension('EXT_color_buffer_float');
    this.upd = compile(VERT, UPDATE_FRAG);
    this.draw = compile(DRAW_VERT, DRAW_FRAG);
    for (const n of ['uPos', 'uVel', 'uDt', 'uTime', 'uSpeed', 'uTurb', 'uRadius', 'uSwirl', 'uBurst', 'uPulse'])
      this.uU[n] = gl.getUniformLocation(this.upd, n);
    for (const n of ['uPos', 'uVel', 'uW', 'uVP', 'uTrail', 'uAmount', 'uWarm', 'uDiscR', 'uAspect'])
      this.uD[n] = gl.getUniformLocation(this.draw, n);
  }

  private alloc(w: number) {
    const gl = this.gl;
    for (const st of this.s) {
      gl.deleteTexture(st.pos);
      gl.deleteTexture(st.vel);
      gl.deleteFramebuffer(st.fb);
    }
    this.s = [];
    this.w = w;
    const n = w * w;
    const pos = new Float32Array(n * 4);
    const vel = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const z = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z) * (0.9 + Math.random() * 0.25);
      pos[i * 4] = r * Math.cos(a);
      pos[i * 4 + 1] = r * Math.sin(a);
      pos[i * 4 + 2] = z * (0.9 + Math.random() * 0.25);
      pos[i * 4 + 3] = Math.random(); // staggered lives
      vel[i * 4 + 3] = Math.random(); // seed
    }
    const tex = (data: Float32Array) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, w, 0, gl.RGBA, gl.FLOAT, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    for (let k = 0; k < 2; k++) {
      const p = tex(pos);
      const v = tex(vel);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, p, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, v, 0);
      this.s.push({ pos: p, vel: v, fb });
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Advance the simulation once per frame. */
  step(time: number, pulse: number, params: Record<string, number>, quality: number) {
    if (!this.ok) return;
    const w = quality <= 0.5 ? 256 : quality < 1 ? 384 : 512;
    if (w !== this.w) this.alloc(w);
    const dt = this.lastTime < 0 ? 1 / 60 : Math.min(0.05, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    this.orbit += dt * (params.cpOrbit ?? 0) * 0.25;
    const gl = this.gl;
    const src = this.s[this.idx];
    const dst = this.s[1 - this.idx];
    gl.bindVertexArray(this.quadVao);
    gl.useProgram(this.upd);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.pos);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, src.vel);
    const u = this.uU;
    gl.uniform1i(u.uPos, 0);
    gl.uniform1i(u.uVel, 1);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uSpeed, params.cpSpeed ?? 0.4);
    gl.uniform1f(u.uTurb, params.cpTurb ?? 0.5);
    gl.uniform1f(u.uRadius, params.cpRadius ?? 1.1);
    gl.uniform1f(u.uSwirl, params.cpSwirl ?? 0.3);
    gl.uniform1f(u.uBurst, params.cpBurst ?? 0.4);
    gl.uniform1f(u.uPulse, pulse);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, this.w, this.w);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    this.idx = 1 - this.idx;
  }

  /** Draw the cloud additively into a framebuffer of size w×h. */
  render(fb: WebGLFramebuffer | null, w: number, h: number, d: ParticleDraw) {
    const amount = d.params.cpAmount ?? 0;
    if (!this.ok || !this.w || amount <= 0.001) return;
    const gl = this.gl;
    const st = this.s[this.idx];
    const count = Math.floor(this.w * this.w * Math.max(0, Math.min(1, d.params.cpDensity ?? 0.6)));
    if (count <= 0) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(this.emptyVao);
    gl.useProgram(this.draw);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, st.pos);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, st.vel);
    const u = this.uD;
    gl.uniform1i(u.uPos, 0);
    gl.uniform1i(u.uVel, 1);
    gl.uniform1i(u.uW, this.w);
    gl.uniformMatrix4fv(u.uVP, false, viewProj(w / h, this.orbit, d.params.cpTilt ?? 0.25));
    gl.uniform1f(u.uTrail, d.params.cpTrail ?? 0.4);
    gl.uniform1f(u.uAmount, amount);
    gl.uniform1f(u.uWarm, d.params.cpWarm ?? 0.3);
    gl.uniform1f(u.uDiscR, d.disc * 2.0);
    gl.uniform1f(u.uAspect, w / h);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.LINES, 0, count * 2);
    gl.disable(gl.BLEND);
  }
}

/** perspective * lookAt for a camera orbiting the origin at distance 3.2 */
function viewProj(aspect: number, yaw: number, tilt: number): Float32Array {
  const fov = (45 * Math.PI) / 180;
  const f = 1 / Math.tan(fov / 2);
  const near = 0.1, far = 20;
  const P = [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0];
  const dist = 3.2;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt * 0.6), st = Math.sin(tilt * 0.6);
  const eye = [dist * sy * ct, dist * st, dist * cy * ct];
  const zx = eye[0] / dist, zy = eye[1] / dist, zz = eye[2] / dist; // forward (from target to eye)
  // right = up × z
  let rx = zz, ry = 0, rz = -zx;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl; ry /= rl; rz /= rl;
  const ux = zy * rz - zz * ry, uy = zz * rx - zx * rz, uz = zx * ry - zy * rx;
  const V = [
    rx, ux, zx, 0,
    ry, uy, zy, 0,
    rz, uz, zz, 0,
    -(rx * eye[0] + ry * eye[1] + rz * eye[2]),
    -(ux * eye[0] + uy * eye[1] + uz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ];
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k];
      out[c * 4 + r] = s;
    }
  return out;
}

