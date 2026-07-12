export const VERTEX_SOURCE = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

export const FRAGMENT_SOURCE = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float day;
uniform float dateSeed;

const float DATE_VARIATION = 0.50;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float dateVariation(float value) {
  return mix(0.5, value, DATE_VARIATION);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x),
    f.y
  );
}

vec3 ramp(float t) {
  vec3 night = vec3(0.015,0.035,0.12);
  vec3 blue = vec3(0.075,0.22,0.46);
  vec3 dayBlue = vec3(0.31,0.70,0.86);
  vec3 gold = vec3(1.0,0.59,0.28);
  vec3 blush = vec3(0.92,0.34,0.35);
  vec3 dusk = vec3(0.28,0.10,0.32);
  float cycle = sin(t * 6.283185);
  float warm = smoothstep(-.15,.5,cycle) * (1.0 - smoothstep(.25,.95,cycle));
  vec3 sky = mix(night, blue, smoothstep(0.,.22,t));
  sky = mix(sky, dayBlue, smoothstep(.18,.42,t));
  sky = mix(sky, gold, smoothstep(.34,.54,t));
  sky = mix(sky, blush, smoothstep(.48,.64,t));
  sky = mix(sky, dusk, smoothstep(.60,.80,t));
  sky = mix(sky, night, smoothstep(.78,1.,t));
  return sky + warm * vec3(.12,.04,-.01);
}

vec3 palette(float offset) {
  return ramp(fract(day + offset));
}

float cyclicDistance(float value, float center) {
  return abs(fract(value - center + 0.5) - 0.5);
}

float phaseWeight(float value, float center, float radius) {
  float weight = 1.0 - smoothstep(0.0, radius, cyclicDistance(value, center));
  return weight * weight * (3.0 - 2.0 * weight);
}

float phaseValue(
  vec4 weights,
  float duskWeight,
  vec4 values,
  float duskValue
) {
  return dot(weights, values) + duskWeight * duskValue;
}

float organicField(
  vec2 p,
  vec2 center,
  vec2 scale,
  float aspectCorrection,
  float rotation,
  float phase,
  float warpStrength,
  float softness
) {
  float cosine = cos(rotation);
  float sine = sin(rotation);
  mat2 transform = mat2(cosine, -sine, sine, cosine);
  vec2 q = transform * (p - center);
  q.x *= aspectCorrection;

  float bend = sin(q.y * 3.2 + phase) * 0.10 * warpStrength;
  bend += sin(q.y * 6.1 - phase * 0.7) * 0.025 * warpStrength;
  q.x += bend * scale.x;
  q.y += sin(q.x * 3.7 + phase * 0.6) * 0.035 * scale.y * warpStrength;

  float distanceFromCenter = length(q / scale);
  return 1.0 - smoothstep(1.0 - softness, 1.0 + softness, distanceFromCenter);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float aspect = resolution.x / resolution.y;
  vec2 p = uv - 0.5;
  float aspectCorrection = clamp(sqrt(aspect), 0.80, 1.25);

  float localTime = fract(day);
  float minutes = time * 0.0000166667;
  float seedA = dateVariation(hash(vec2(dateSeed, 11.7)));
  float seedB = dateVariation(hash(vec2(dateSeed, 37.1)));
  float seedC = dateVariation(hash(vec2(dateSeed, 83.9)));
  float seedD = dateVariation(hash(vec2(dateSeed, 149.3)));
  float seedE = dateVariation(hash(vec2(dateSeed, 211.9)));
  float seedF = dateVariation(hash(vec2(dateSeed, 293.7)));
  vec2 seedOffset = vec2(seedA - 0.5, seedB - 0.5);

  float nightWeight = phaseWeight(localTime, 0.00, 0.28);
  float dawnWeight = phaseWeight(localTime, 0.25, 0.22);
  float dayWeight = phaseWeight(localTime, 0.50, 0.22);
  float goldenWeight = phaseWeight(localTime, 0.65, 0.18);
  float duskWeight = phaseWeight(localTime, 0.78, 0.20);
  float weightTotal = nightWeight + dawnWeight + dayWeight + goldenWeight + duskWeight;
  vec4 phaseWeights = vec4(
    nightWeight,
    dawnWeight,
    dayWeight,
    goldenWeight
  ) / weightTotal;
  duskWeight /= weightTotal;

  vec2 warmTimeOffset = vec2(
    phaseValue(phaseWeights, duskWeight, vec4(-0.10, 0.13, 0.08, -0.04), -0.14),
    phaseValue(phaseWeights, duskWeight, vec4(0.05, 0.15, 0.06, 0.10), 0.02)
  );
  vec2 edgeTimeOffset = vec2(
    phaseValue(phaseWeights, duskWeight, vec4(0.02, 0.12, 0.18, -0.10), -0.18),
    phaseValue(phaseWeights, duskWeight, vec4(0.06, -0.06, 0.14, -0.09), 0.05)
  );
  vec2 counterTimeOffset = vec2(
    phaseValue(phaseWeights, duskWeight, vec4(-0.10, 0.14, 0.04, -0.08), 0.12),
    phaseValue(phaseWeights, duskWeight, vec4(0.02, -0.12, 0.10, 0.08), -0.10)
  );

  float warmScale = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.76, 1.24, 1.34, 0.88),
    1.04
  );
  float edgeScale = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(1.18, 0.82, 0.78, 1.06),
    1.20
  );
  float counterScale = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(1.16, 1.12, 0.82, 0.92),
    1.10
  );
  float warmStrength = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.22, 0.48, 0.38, 0.56),
    0.50
  );
  float edgeStrength = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.54, 0.30, 0.28, 0.52),
    0.58
  );
  float counterStrength = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.44, 0.40, 0.24, 0.30),
    0.46
  );
  float cutStrength = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.38, 0.22, 0.14, 0.28),
    0.44
  );
  float warpStrength = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.90, 0.76, 0.58, 1.18),
    1.34
  );
  float fieldSoftness = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.30, 0.36, 0.40, 0.30),
    0.28
  );

  float boundaryNoise = noise(
    uv * 2.15 + seedOffset * 4.0 + vec2(minutes * 0.012, -minutes * 0.008)
  );
  float horizonDrift = sin(minutes * 0.11 + p.x * 1.7) * 0.010;
  horizonDrift += (boundaryNoise - 0.5) * 0.014;

  vec3 horizon = ramp(fract(localTime - 0.10));
  vec3 zenith = ramp(fract(localTime + 0.025));
  float atmosphere = smoothstep(0.04, 0.96, uv.y + horizonDrift);
  vec3 color = mix(horizon, zenith, atmosphere);
  vec3 atmosphereColor = color;

  float warmPhase = minutes * 0.075;
  vec2 warmCenter = vec2(
    -0.27 + (seedA - 0.5) * 0.32 + sin(minutes * 0.041) * 0.055,
    -0.31 + (seedB - 0.5) * 0.28 + cos(minutes * 0.033) * 0.045
  ) + warmTimeOffset;
  vec2 warmDimensions = vec2(
    mix(0.38, 0.66, seedC),
    mix(0.30, 0.54, seedD)
  ) * warmScale;
  float warmField = organicField(
    p,
    warmCenter,
    warmDimensions,
    aspectCorrection,
    mix(-0.82, 0.38, seedE) + phaseWeights.w * 0.34 - duskWeight * 0.24,
    warmPhase + seedF * 6.283185,
    warpStrength * mix(0.72, 1.34, seedB),
    fieldSoftness
  );
  float warmCut = organicField(
    p,
    warmCenter + vec2(mix(-0.20, 0.20, seedD), mix(-0.15, 0.15, seedE)),
    warmDimensions * vec2(mix(0.34, 0.62, seedA), mix(0.38, 0.70, seedF)),
    aspectCorrection,
    seedC * 3.141593,
    warmPhase + seedE * 4.0,
    warpStrength * 0.68,
    fieldSoftness * 1.16
  );
  warmField *= 1.0 - warmCut * mix(0.12, 0.58, seedF);
  warmField *= 0.78 + boundaryNoise * 0.12;
  float warmOffset = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(-0.08, -0.19, -0.14, -0.24),
    -0.21
  );
  warmOffset += mix(-0.06, 0.06, seedE);
  color = mix(
    color,
    palette(warmOffset),
    warmField * warmStrength * mix(0.88, 1.22, seedC)
  );

  float edgePhase = 1.7 + minutes * 0.052;
  vec2 edgeCenter = vec2(
    0.34 + (seedD - 0.5) * 0.34 + cos(minutes * 0.029) * 0.045,
    0.08 + (seedE - 0.5) * 0.40 + sin(minutes * 0.037) * 0.055
  ) + edgeTimeOffset;
  float edgeField = organicField(
    p,
    edgeCenter,
    vec2(mix(0.25, 0.48, seedF), mix(0.42, 0.76, seedA)) * edgeScale,
    aspectCorrection,
    mix(-0.46, 0.72, seedB) - phaseWeights.y * 0.24 + duskWeight * 0.30,
    edgePhase + seedC * 6.283185,
    warpStrength * mix(0.68, 1.28, seedD),
    fieldSoftness * mix(0.86, 1.10, seedF)
  );
  edgeField *= 0.84 + (1.0 - boundaryNoise) * 0.10;
  float edgeOffset = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.18, 0.21, 0.16, 0.24),
    0.27
  );
  edgeOffset += mix(-0.07, 0.07, seedC);
  color = mix(
    color,
    palette(edgeOffset),
    edgeField * edgeStrength * mix(0.90, 1.28, seedE)
  );

  float counterPhase = 3.4 + minutes * 0.046;
  vec2 counterCenter = vec2(
    -0.05 + (seedF - 0.5) * 0.38 + sin(minutes * 0.027) * 0.05,
    0.25 + (seedC - 0.5) * 0.32 + cos(minutes * 0.031) * 0.04
  ) + counterTimeOffset;
  vec2 counterDimensions = vec2(
    mix(0.22, 0.42, seedB),
    mix(0.22, 0.44, seedE)
  ) * counterScale;
  float counterField = organicField(
    p,
    counterCenter,
    counterDimensions,
    aspectCorrection,
    mix(-1.02, 0.42, seedD) + phaseWeights.y * 0.28 - duskWeight * 0.32,
    counterPhase + seedA * 6.283185,
    warpStrength * mix(0.78, 1.38, seedF),
    fieldSoftness * 1.10
  );
  float cutAngle = seedF * 6.283185;
  vec2 cutOffset = vec2(cos(cutAngle), sin(cutAngle)) * mix(0.08, 0.20, seedA);
  float counterCut = organicField(
    p,
    counterCenter + cutOffset,
    counterDimensions * vec2(mix(0.44, 0.76, seedC), mix(0.42, 0.72, seedD)),
    aspectCorrection,
    cutAngle,
    counterPhase + seedE * 4.0,
    warpStrength * 0.72,
    fieldSoftness * 1.18
  );
  counterField *= 1.0 - counterCut * min(0.78, cutStrength * mix(1.0, 1.70, seedB));
  float counterOffset = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(0.29, 0.25, 0.20, 0.30),
    0.34
  );
  counterOffset += mix(-0.08, 0.08, seedF);
  color = mix(
    color,
    palette(counterOffset),
    counterField * counterStrength * mix(0.92, 1.34, seedA)
  );
  color = mix(atmosphereColor, color, 0.94);

  float centerLight = 1.0 - smoothstep(
    0.18,
    0.82,
    length(p / vec2(0.72, 0.62))
  );
  color *= 0.92 + centerLight * 0.08;

  float nightLift = 1.0 - smoothstep(0.08, 0.28, length(color));
  color += palette(0.025) * nightLift * 0.035;
  float saturation = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(1.06, 1.10, 1.08, 1.12),
    1.14
  );
  float contrast = phaseValue(
    phaseWeights,
    duskWeight,
    vec4(1.02, 1.05, 1.03, 1.06),
    1.07
  );
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luminance), color, saturation) * contrast;
  gl_FragColor = vec4(pow(max(color, 0.0), vec3(0.92)), 1.0);
}`;
