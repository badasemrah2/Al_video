import Replicate from 'replicate';

const env = (globalThis as any).process?.env || {};
if (!env.REPLICATE_API_TOKEN) {
  console.warn('[replicate-client] Missing REPLICATE_API_TOKEN environment variable');
}

// Allow overriding models via env so user can switch cheaper / different versions without code change
const TEXT2VIDEO_MODEL = env.REPLICATE_T2V_MODEL || 'stability-ai/stable-video-diffusion';
const TEXT2VIDEO_VERSION = env.REPLICATE_T2V_VERSION || '3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438';
const IMG2VIDEO_MODEL = env.REPLICATE_I2V_MODEL || 'stability-ai/stable-video-diffusion-img2vid';
const IMG2VIDEO_VERSION = env.REPLICATE_I2V_VERSION || '3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438';

export const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

function modelRef(model: string, version: string) {
  return `${model}:${version}` as any; // relax typing for dynamic env-based models
}

export async function generateTextToVideo(
  prompt: string,
  options: {
    negative_prompt?: string;
    num_frames?: number; // non-Kling
    duration?: number; // Kling
    num_inference_steps?: number;
    width?: number;
    height?: number;
    fps?: number;
    cfg_scale?: number; // Kling
    aspect_ratio?: string; // Kling
    webhook?: string; // Replicate webhook URL
    jobId?: string; // Our job ID for webhook identification
  }
) {
  if (!prompt) throw new Error('Prompt required');
  const isKling = TEXT2VIDEO_MODEL.includes('kling');
  if (!isKling && TEXT2VIDEO_MODEL.includes('img2vid')) {
    console.warn('[replicate-client] TEXT2VIDEO_MODEL seems to be an image-to-video model; may cause 422');
  }
  const baseInput: any = { prompt };
  if (isKling) {
    // Kling expects duration (seconds), optional cfg_scale, aspect_ratio; ignores width/height unless derived
    if (options.duration) baseInput.duration = options.duration;
    if (options.cfg_scale) baseInput.cfg_scale = options.cfg_scale;
    if (options.aspect_ratio) baseInput.aspect_ratio = options.aspect_ratio;
    if (options.negative_prompt) baseInput.negative_prompt = options.negative_prompt;
    // Safety defaults to avoid 422
    if (![5,10].includes(baseInput.duration)) {
      baseInput.duration = baseInput.duration && baseInput.duration < 7 ? 5 : 10;
    }
    const allowedAR = ['16:9','9:16','1:1'];
    if (!allowedAR.includes(baseInput.aspect_ratio)) {
      baseInput.aspect_ratio = '16:9';
    }
  } else {
    // Diffusion style generic model
    baseInput.num_inference_steps = options.num_inference_steps || 25;
    if (options.num_frames) baseInput.num_frames = options.num_frames;
    if (options.width) baseInput.width = options.width;
    if (options.height) baseInput.height = options.height;
    if (options.fps) baseInput.fps = options.fps;
    if (options.negative_prompt) baseInput.negative_prompt = options.negative_prompt;
  }
  try {
  // Debug log (can be removed later)
  console.log('[generateTextToVideo] model', TEXT2VIDEO_MODEL, 'input', baseInput);
    
    // Prepare Replicate run options
    const runOptions: any = { input: baseInput };
    
    // Add webhook if provided
    if (options.webhook && options.jobId) {
      runOptions.webhook = `${options.webhook}?job_id=${encodeURIComponent(options.jobId)}`;
      runOptions.webhook_events_filter = ["completed"];
    }
    
    return await replicate.run(
      modelRef(TEXT2VIDEO_MODEL, TEXT2VIDEO_VERSION),
      runOptions
    );
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('input_image is required')) {
      throw new Error('Seçili model bir image-to-video modeli (input_image bekliyor). Lütfen ya bir başlangıç görseli kullanın ya da gerçek text-to-video model slug/version girin.');
    }
    throw err;
  }
}

export async function generateImageToVideo(
  image: string,
  options: { motion_bucket_id?: number; fps: number; num_frames: number; prompt?: string }
) {
  if (!image) throw new Error('Image required');
  
  // Kling model uses reference_images parameter for image-to-video
  const input: any = { 
    reference_images: [image], // Kling model expects an array of reference images
    prompt: options.prompt || "A high quality video"
  };
  
  // Add other Kling-specific parameters if provided
  if (options.fps) input.fps = options.fps;
  if (options.num_frames) input.num_frames = options.num_frames;
  
  return await replicate.run(
    modelRef(IMG2VIDEO_MODEL, IMG2VIDEO_VERSION),
    { input }
  );
}
