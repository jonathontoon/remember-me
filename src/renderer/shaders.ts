export const VERTEX_SOURCE = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

export const FRAGMENT_SOURCE = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float day;

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
  float localTime = fract(day);
  float drift = sin(time * .00007 + p.y * 3.0) * .012 + noise(uv * 2.3 + time*.000025) * .018;
  vec3 top = ramp(localTime + .02);
  vec3 bottom = ramp(localTime - .10);
  vec3 color = mix(top, bottom, smoothstep(.10,.92,uv.y) + drift);
  float vignette = 1.0 - smoothstep(.24,.82,length(p / vec2(aspect,.8)));
  color *= .88 + vignette * .12;
  gl_FragColor = vec4(pow(max(color,0.0), vec3(.92)), 1.0);
}`;
