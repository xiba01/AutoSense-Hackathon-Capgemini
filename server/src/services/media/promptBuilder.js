function buildImagePrompt(scene, carContext) {
  const { identity, visual_directives } = carContext;
  const { visual_direction } = scene;

  const subject = `${identity.year} ${identity.make} ${identity.model}, ${visual_directives.image_prompt_color}, ${identity.body_type}`;

  const action = visual_direction?.camera_angle || "Cinematic Wide Shot";
  const focus = visual_direction?.focus_point || "The whole car";

  const environment = `${visual_direction?.setting || "Showroom"}, ${
    visual_direction?.lighting || "Studio Lighting"
  }`;

  const style =
    "photorealistic, 8k, highly detailed, automotive photography, commercial car advertisement, ray tracing, unreal engine 5 render, sharp focus";

  const fullPrompt = `${action} of a ${subject}, focusing on ${focus}. ${environment}. ${style}`;

  return fullPrompt;
}

module.exports = { buildImagePrompt };
