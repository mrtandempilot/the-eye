"""
THE EYE — COSMIC EYE for TouchDesigner
======================================

Builds a complete network in /project1/cosmic_eye:

  • the COSMIC EYE image in the centre (pin-sharp, soft edge)
  • a crisp starfield with twinkle + occasional shooting stars (GLSL)
  • hair-thin "cosmic threads": sparks injected around the image and carried
    by a curl-noise flow field in a feedback loop (GLSL + Feedback TOP)
  • audio input → kick detector → shake / shockwave / bursts on every kick
  • a custom parameter page "Cosmic Eye" on the component to control it all
  • a Window COMP for fullscreen output on a projector

HOW TO RUN
  1. Set IMAGE_PATH below to where cosmic-eye.jpg is on your computer
     (it is in the repo at public/templates/cosmic-eye.jpg). You can also
     change it later on the component's "Cosmic Eye" page.
  2. In TouchDesigner: Dialogs → Textport (Alt+T) and type
         exec(open(r'C:/path/to/build_cosmic_eye.py', encoding='utf-8').read())
     (or paste this file into a Text DAT, right-click it → Run Script).
  3. Open /project1/cosmic_eye and view the 'OUT' node.
     Fullscreen: select window1 inside it and press "Open" (Window page),
     or use Perform mode.

Running it again rebuilds the component from scratch.
"""

IMAGE_PATH = r'C:/TheEye/cosmic-eye.jpg'   # ← change me
WIDTH, HEIGHT = 1920, 1080

# --------------------------------------------------------------------------- GLSL
COMMON = r'''
float h12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(h12(i),h12(i+vec2(1,0)),u.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),u.x),u.y); }
float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return s; }
vec4 P(int i){ return texelFetch(sTD2DInputs[i], ivec2(0,0), 0); }
'''

STARS = r'''
// inputs: 0 = params0 (time, kick, starBright, shootRate)
//         1 = params2 (starDensity, twinkle, flowSpeed, swirl)
out vec4 fragColor;
''' + COMMON + r'''
vec3 starLayer(vec2 p, float scale, float seed, float px, float t, float dens, float twinkle, bool spikes){
  vec2 ip = floor(p*scale);
  vec3 c = vec3(0.0);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 id = ip + vec2(float(i), float(j));
    vec2 h = h22(id + seed);
    if(h.x <= dens){
      float h3 = h12(id + seed*1.7);
      vec2 sp = (id + 0.15 + 0.7*h22(id*1.31 + seed))/scale;
      vec2 d = (p - sp)/px;
      float mag = pow(h3, 3.0);
      float rad = 0.9*(0.6 + 1.8*mag);
      float core = exp(-dot(d,d)/(rad*rad));
      float tw = 1.0 - twinkle*0.85*(0.5 + 0.5*sin(t*(1.5 + 4.0*h.y) + h3*40.0));
      float spike = 0.0;
      if(spikes && mag > 0.35){
        float L = mix(4.0, 16.0, mag);
        spike = (exp(-abs(d.y)*1.6)*exp(-abs(d.x)/L) + exp(-abs(d.x)*1.6)*exp(-abs(d.y)/L))*0.6*mag;
      }
      vec3 tint = mix(vec3(1.0,0.82,0.62), vec3(0.68,0.8,1.0), h12(id + seed*3.3));
      tint = mix(tint, vec3(1.0), 0.45);
      c += tint*(core + spike)*(0.25 + 1.6*mag)*tw;
    }
  }
  return c;
}

vec3 shooting(vec2 p, float t, float px, float rate, float asp){
  vec3 c = vec3(0.0);
  if(rate < 0.01) return c;
  for(int k=0;k<4;k++){
    float fk = float(k);
    float period = mix(16.0, 1.6, rate)*(0.7 + 0.9*h12(vec2(fk, 3.1)));
    float tt = t + fk*7.31;
    float cyc = floor(tt/period);
    float local = fract(tt/period)*period;
    float dur = 0.9;
    vec2 r = h22(vec2(cyc, fk*13.7));
    bool isOn = local <= dur && h12(vec2(cyc*1.7, fk)) <= 0.8;
    if(isOn){
      vec2 start = vec2((r.x - 0.5)*asp*1.1, 0.15 + r.y*0.45);
      float ang = -0.35 - h12(vec2(fk, cyc))*0.9;
      if(r.x > 0.5) ang = 3.14159265 - ang;
      vec2 dir = vec2(cos(ang), sin(ang));
      float u = local/dur;
      vec2 head = start + dir*u*0.8;
      float trail = 0.25;
      vec2 v = p - head;
      float along = -dot(v, dir);
      float perp = abs(dot(v, vec2(-dir.y, dir.x)));
      if(along >= -px*3.0 && along <= trail){
        float a = 1.0 - clamp(along/trail, 0.0, 1.0);
        float w = px*mix(0.8, 1.6, a);
        float line = exp(-(perp*perp)/(w*w))*a*a;
        float headGlow = exp(-dot(v,v)/(px*px*6.0));
        float fade = smoothstep(0.0, 0.12, u)*smoothstep(1.0, 0.75, u);
        c += vec3(0.85,0.92,1.0)*(line*1.3 + headGlow*1.5)*fade;
      }
    }
  }
  return c;
}

void main(){
  vec4 P0 = P(0); vec4 P2 = P(1);
  float t = P0.r, bright = P0.b, rate = P0.a;
  vec2 res = uTDOutputInfo.res.zw;
  float asp = res.x/res.y;
  vec2 uv = (vUV.st - 0.5)*vec2(asp, 1.0);
  float px = 1.0/res.y;
  // faint nebula haze
  vec2 q = uv*1.3 + vec2(t*0.004, 0.0);
  float n = fbm(q*1.6), n2 = fbm(q*3.1 - 4.0 + n);
  vec3 neb = mix(vec3(0.20,0.06,0.42), vec3(0.06,0.22,0.65), n2)*pow(clamp(n*n2*2.2,0.0,1.0), 2.2);
  vec3 col = vec3(0.004,0.004,0.012) + neb*0.2;
  vec2 drift = vec2(t*0.0004, t*0.00015);
  float dens = mix(0.05, 0.75, P2.r);
  col += starLayer(uv + drift*0.4, 70.0, 11.0, px, t, dens, P2.g, false)*0.55*bright;
  col += starLayer(uv + drift*0.7, 38.0, 23.0, px, t, dens, P2.g, false)*0.8*bright;
  col += starLayer(uv + drift,     16.0, 37.0, px, t, dens, P2.g, true)*bright;
  col += shooting(uv, t, px, rate, asp)*bright;
  fragColor = TDOutputSwizzle(vec4(col, 1.0));
}
'''

FLOW = r'''
// inputs: 0 = feedback (previous frame), 1 = params0, 2 = params1, 3 = params2, 4 = params3
// params1 = (flowBright, imageSize, imageSoft, kickShake)
// params3 = (trail, -, -, -)
out vec4 fragColor;
''' + COMMON + r'''
float field(vec2 p){ return fbm(p); }
vec2 curl(vec2 p){
  float e = 0.01;
  float a = field(p + vec2(0.0, e)), b = field(p - vec2(0.0, e));
  float c = field(p + vec2(e, 0.0)), d = field(p - vec2(e, 0.0));
  return vec2(a - b, -(c - d))/(2.0*e);
}
void main(){
  vec4 P0 = P(1), P1 = P(2), P2 = P(3), P3 = P(4);
  float t = P0.r, kick = P0.g;
  float size = P1.g, speed = P2.b, swirl = P2.a, trail = P3.r;
  vec2 res = uTDOutputInfo.res.zw;
  float asp = res.x/res.y;
  vec2 uv = vUV.st;
  vec2 c = (uv - 0.5)*vec2(asp, 1.0);
  float r = length(c) + 1e-5;
  vec2 vel = curl(c*1.6 + vec2(0.0, t*0.03))*0.6 + vec2(-c.y, c.x)*swirl*1.2 + (c/r)*kick*0.8;
  vec2 duv = vel*(0.0015 + 0.004*speed)/vec2(asp, 1.0);
  vec3 prev = texture(sTD2DInputs[0], uv - duv).rgb*mix(0.90, 0.995, trail);
  // inject single-pixel sparks in a band around the image edge
  float R = size*0.5;
  float band = smoothstep(R*0.9, R, r)*smoothstep(R*2.3, R*1.1, r);
  vec2 cell = floor(uv*res);
  float rnd = h12(cell + fract(t*13.7)*1000.0);
  float spark = step(1.0 - 0.0025*(1.0 + kick*3.0), rnd)*band;
  vec3 tint = mix(vec3(0.55,0.3,1.0), vec3(0.3,0.85,1.0), h12(cell*0.37));
  tint = mix(tint, vec3(1.0,0.6,0.3), 0.3*step(0.8, h12(cell + 3.0)));
  fragColor = TDOutputSwizzle(vec4(prev + tint*spark*1.5, 1.0));
}
'''

COMP = r'''
// inputs: 0 = stars, 1 = flow, 2 = image, 3 = params0, 4 = params1
out vec4 fragColor;
''' + COMMON + r'''
void main(){
  vec4 P0 = P(3), P1 = P(4);
  float t = P0.r, kick = P0.g;
  float flowBright = P1.r, size = P1.g, soft = P1.b, shake = P1.a;
  vec2 res = uTDOutputInfo.res.zw;
  float asp = res.x/res.y;
  vec2 uv = vUV.st;
  uv += (h22(vec2(floor(t*60.0), 1.0)) - 0.5)*0.03*shake*kick;          // shake
  vec2 c = (uv - 0.5)*vec2(asp, 1.0);
  float r = length(c) + 1e-5;
  uv -= (c/r)/vec2(asp, 1.0)*sin(r*40.0 - t*12.0)*exp(-r*3.0)*0.004*kick*shake;  // shockwave
  c = (uv - 0.5)*vec2(asp, 1.0);
  vec3 col = texture(sTD2DInputs[0], uv).rgb;
  // centred image: the circle of radius R spans the image width
  vec2 isz = vec2(textureSize(sTD2DInputs[2], 0));
  float iasp = isz.x/max(isz.y, 1.0);
  float R = size*0.5*(1.0 + 0.04*kick);
  vec2 q = c/R;
  vec2 iuv = vec2(q.x*0.5 + 0.5, q.y*0.5*iasp + 0.5);
  vec3 img = texture(sTD2DInputs[2], iuv).rgb;
  float m = 1.0 - smoothstep(1.0 - soft*0.6 - 0.002, 1.0, length(q));
  col = mix(col, img, m);
  col += texture(sTD2DInputs[1], uv).rgb*flowBright;                    // cosmic threads
  col += vec3(0.7,0.8,1.0)*kick*shake*0.06;                              // flash
  fragColor = TDOutputSwizzle(vec4(col, 1.0));
}
'''


# --------------------------------------------------------------------------- helpers
def _set(o, name, val, expr=False):
    try:
        p = getattr(o.par, name)
        if p is None:
            raise AttributeError(name)
        if expr:
            p.expr = val
        else:
            p.val = val
        return True
    except Exception as e:  # keep building even if a parameter name differs
        print('THE EYE: could not set %s.%s (%s)' % (o.path, name, e))
        return False


def _res(o, w, h, fmt=None):
    _set(o, 'outputresolution', 'custom')
    _set(o, 'resolutionw', w)
    _set(o, 'resolutionh', h)
    if fmt:
        _set(o, 'format', fmt)


def _pos(o, x, y):
    o.nodeX, o.nodeY = x, y


def _wire(dst, *srcs):
    for s in srcs:
        s.outputConnectors[0].connect(dst)


def _float(page, name, label, lo, hi, default):
    pg = page.appendFloat(name, label=label)
    p = pg[0]
    p.normMin, p.normMax = lo, hi
    p.default = default
    p.val = default
    return p


# --------------------------------------------------------------------------- build
def build():
    root = op('/project1')
    old = root.op('cosmic_eye')
    if old:
        old.destroy()
    c = root.create(baseCOMP, 'cosmic_eye')
    _pos(c, 0, 0)

    # ---- control page
    page = c.appendCustomPage('Cosmic Eye')
    f = page.appendFile('Imagefile', label='Image File')[0]
    f.val = IMAGE_PATH
    _float(page, 'Imagesize', 'Image Size', 0.2, 1.4, 0.8)
    _float(page, 'Imagesoft', 'Image Edge Softness', 0.0, 1.0, 0.35)
    _float(page, 'Starbright', 'Star Brightness', 0.0, 2.0, 1.0)
    _float(page, 'Stardensity', 'Star Density', 0.0, 1.0, 0.55)
    _float(page, 'Twinkle', 'Twinkle', 0.0, 1.0, 0.5)
    _float(page, 'Shootrate', 'Shooting Stars', 0.0, 1.0, 0.35)
    _float(page, 'Flowbright', 'Thread Brightness', 0.0, 2.0, 1.0)
    _float(page, 'Trail', 'Thread Length', 0.0, 1.0, 0.75)
    _float(page, 'Flowspeed', 'Flow Speed', 0.0, 1.0, 0.5)
    _float(page, 'Swirl', 'Swirl', -1.0, 1.0, 0.25)
    _float(page, 'Kickgain', 'Kick Sensitivity', 0.0, 30.0, 8.0)
    _float(page, 'Kickshake', 'Kick Shake', 0.0, 1.0, 0.4)

    # ---- audio → kick
    adev = c.create(audiodeviceinCHOP, 'audio_in'); _pos(adev, -800, -400)
    afil = c.create(audiofilterCHOP, 'lowpass'); _pos(afil, -650, -400)
    _set(afil, 'filter', 'lowpass')
    for n in ('cutoff', 'cutofffrequency', 'cutofflog'):
        if _set(afil, n, 120):
            break
    ana = c.create(analyzeCHOP, 'level'); _pos(ana, -500, -400)
    if not _set(ana, 'function', 'rmspower'):
        _set(ana, 'function', 'rms')
    lag = c.create(lagCHOP, 'smooth'); _pos(lag, -350, -400)
    _set(lag, 'lag1', 0.0)
    _set(lag, 'lag2', 0.15)
    kick = c.create(nullCHOP, 'kick'); _pos(kick, -200, -400)
    _wire(afil, adev); _wire(ana, afil); _wire(lag, ana); _wire(kick, lag)

    # ---- parameter textures (1×1 float constants read by the shaders)
    KICK = "min(1.0, (op('kick')[0].eval() if op('kick') and op('kick').numChans else 0.0) * parent().par.Kickgain)"
    rows = [
        ('params0', ["absTime.seconds % 10000", KICK, "parent().par.Starbright", "parent().par.Shootrate"]),
        ('params1', ["parent().par.Flowbright", "parent().par.Imagesize", "parent().par.Imagesoft", "parent().par.Kickshake"]),
        ('params2', ["parent().par.Stardensity", "parent().par.Twinkle", "parent().par.Flowspeed", "parent().par.Swirl"]),
        ('params3', ["parent().par.Trail", "0", "0", "0"]),
    ]
    prm = {}
    for i, (name, exprs) in enumerate(rows):
        k = c.create(constantTOP, name)
        _pos(k, -800, 200 - i * 120)
        _res(k, 1, 1, 'rgba32float')
        for par, ex in zip(('colorr', 'colorg', 'colorb', 'alpha'), exprs):
            _set(k, par, ex, expr=True)
        prm[name] = k

    # ---- shaders
    def shader(name, src, x, y):
        d = c.create(textDAT, name + '_pixel')
        d.text = src
        _pos(d, x, y + 150)
        g = c.create(glslTOP, name)
        _set(g, 'pixeldat', d.name)
        _res(g, WIDTH, HEIGHT, 'rgba16float')
        _pos(g, x, y)
        return g

    stars = shader('stars', STARS, -400, 300)
    _wire(stars, prm['params0'], prm['params2'])

    img = c.create(moviefileinTOP, 'image'); _pos(img, -400, -100)
    _set(img, 'file', "parent().par.Imagefile", expr=True)

    seed = c.create(constantTOP, 'black'); _pos(seed, -550, 100)
    _res(seed, WIDTH, HEIGHT, 'rgba16float')
    _set(seed, 'colorr', 0); _set(seed, 'colorg', 0); _set(seed, 'colorb', 0)
    fb = c.create(feedbackTOP, 'feedback'); _pos(fb, -400, 100)
    _wire(fb, seed)
    flow = shader('flow', FLOW, -200, 100)
    _wire(flow, fb, prm['params0'], prm['params1'], prm['params2'], prm['params3'])
    _set(fb, 'top', flow.name)

    comp = shader('composite', COMP, 50, 150)
    _wire(comp, stars, flow, img, prm['params0'], prm['params1'])
    out = c.create(nullTOP, 'OUT'); _pos(out, 250, 150)
    _wire(out, comp)
    out.viewer = True
    out.display = True

    win = c.create(windowCOMP, 'window1'); _pos(win, 250, -100)
    _set(win, 'winop', out.path)
    _set(win, 'winw', WIDTH)
    _set(win, 'winh', HEIGHT)
    _set(win, 'borders', False)

    print('THE EYE: built %s — view %s, fullscreen via %s (Open)' % (c.path, out.path, win.path))
    return c


build()
