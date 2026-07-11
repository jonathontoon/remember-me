const canvas = document.querySelector('#sky');
const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });

if (!gl) {
  document.body.innerHTML = '<p style="padding:2rem;font-family:system-ui">This installation needs a WebGL-capable browser.</p>';
  throw new Error('WebGL unavailable');
}

const vertexSource = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const fragmentSource = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float day;
uniform float latitude;
uniform float daylight;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
vec3 ramp(float t) {
  vec3 night = vec3(0.015,0.035,0.12);
  vec3 blue = vec3(0.075,0.22,0.46);
  vec3 dayBlue = vec3(0.31,0.70,0.86);
  vec3 gold = vec3(1.0,0.59,0.28);
  vec3 blush = vec3(0.92,0.34,0.35);
  vec3 dusk = vec3(0.28,0.10,0.32);
  float cycle = sin(t * 6.283185);
  float warm = smoothstep(-.15,.5,cycle) * smoothstep(.95,.25,cycle);
  vec3 sky = mix(night, blue, smoothstep(0.,.22,t));
  sky = mix(sky, dayBlue, smoothstep(.18,.42,t));
  sky = mix(sky, gold, smoothstep(.34,.54,t));
  sky = mix(sky, blush, smoothstep(.48,.64,t));
  sky = mix(sky, dusk, smoothstep(.60,.80,t));
  sky = mix(sky, night, smoothstep(.78,1.,t));
  return sky + warm * vec3(.12,.04,-.01);
}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float aspect = resolution.x / resolution.y;
  vec2 p = uv - .5; p.x *= aspect;
  float localTime = fract(day + time * .0000015);
  float horizon = pow(1.0 - uv.y, 0.72);
  float drift = sin(time * .00007 + p.y * 3.0) * .012 + noise(uv * 2.3 + time*.000025) * .018;
  vec3 top = ramp(localTime + .02);
  vec3 bottom = ramp(localTime - .10);
  vec3 color = mix(top, bottom, smoothstep(.10,.92,uv.y) + drift);
  float latitudeMod = clamp(abs(latitude) / 90.0, 0.0, 1.0);
  color *= 1.0 - latitudeMod * .06;
  color *= mix(.90, 1.06, daylight);
  float warmthCycle = sin(localTime * 6.283185);
  float haze = exp(-abs(uv.y - .48) * 18.0);
  color += haze * vec3(1.0,.55,.22) * .035 * (1.0 - abs(warmthCycle));
  float vignette = 1.0 - smoothstep(.24,.82,length(p / vec2(aspect,.8)));
  color *= .88 + vignette * .12;
  gl_FragColor = vec4(pow(max(color,0.0), vec3(.92)), 1.0);
}`;

function createShader(type, source) { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)); return shader; }
const program = gl.createProgram();
gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexSource));
gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentSource));
gl.linkProgram(program); gl.useProgram(program);
const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
const uniforms = { resolution: gl.getUniformLocation(program,'resolution'), time: gl.getUniformLocation(program,'time'), day: gl.getUniformLocation(program,'day'), latitude: gl.getUniformLocation(program,'latitude'), daylight: gl.getUniformLocation(program,'daylight') };

const now = new Date();
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
const latitude = Number(localStorage.getItem('sky-latitude') || 36.8);
const januaryOffset = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
const julyOffset = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
const daylightSaving = januaryOffset !== julyOffset && now.getTimezoneOffset() === Math.min(januaryOffset, julyOffset) ? 1 : 0;
const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
let displayedMinutes = minutes;
let lastFaviconSecond = -1;

function updateFaviconFromFrame() {
  const pixel = new Uint8Array(4);
  const sample = (y) => {
    gl.readPixels(Math.floor(canvas.width / 2), y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
  };
  const top = sample(canvas.height - 1);
  const middle = sample(Math.floor(canvas.height * 0.5));
  const bottom = sample(0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${top}"/><stop offset=".56" stop-color="${middle}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/></svg>`;
  document.querySelector('#favicon').href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const infoTrigger = document.querySelector('#info-trigger');
const infoPanel = document.querySelector('#info-panel');
const infoClose = document.querySelector('#info-close');
function setInfoOpen(open) {
  infoTrigger.setAttribute('aria-expanded', String(open));
  infoPanel.setAttribute('aria-hidden', String(!open));
  infoPanel.classList.toggle('pointer-events-none', !open);
  infoPanel.classList.toggle('opacity-0', !open);
  infoPanel.classList.toggle('translate-y-[-8px]', !open);
  infoPanel.classList.toggle('opacity-100', open);
  infoPanel.classList.toggle('translate-y-0', open);
}
infoTrigger.addEventListener('click', () => setInfoOpen(infoTrigger.getAttribute('aria-expanded') !== 'true'));
infoClose.addEventListener('click', () => setInfoOpen(false));

function resize() { const dpr = Math.min(devicePixelRatio, 2); canvas.width = innerWidth*dpr; canvas.height = innerHeight*dpr; gl.viewport(0,0,canvas.width,canvas.height); gl.uniform2f(uniforms.resolution,canvas.width,canvas.height); }
function tick(ms) {
  displayedMinutes = new Date().getHours() * 60 + new Date().getMinutes() + new Date().getSeconds() / 60;
  gl.uniform1f(uniforms.time, ms); gl.uniform1f(uniforms.day, displayedMinutes / 1440); gl.uniform1f(uniforms.latitude, latitude); gl.uniform1f(uniforms.daylight, daylightSaving); gl.drawArrays(gl.TRIANGLES,0,6); requestAnimationFrame(tick);
  const second = Math.floor(ms / 1000);
  if (second !== lastFaviconSecond) { lastFaviconSecond = second; updateFaviconFromFrame(); }
}
addEventListener('resize', resize); resize(); requestAnimationFrame(tick);
