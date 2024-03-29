struct LightData {        // light xyz position
    lightPos : vec3<f32>,
};

struct FragmentInput {              // output from vertex stage shader
    @location(0) fragColor : vec3<f32>,
    @location(3) fragPos : vec3<f32>,
};

// bind light data buffer
@group(0) @binding(3) var<uniform> lightData : LightData;
const ambientLightFactor : f32 = 0.25;     // ambient light

@fragment
fn main(input : FragmentInput) -> @location(0) vec4<f32> {
    let lightDirection: vec3<f32> = normalize(lightData.lightPos - input.fragPos);

    return vec4<f32>(input.fragColor, 1.0);
};