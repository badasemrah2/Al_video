import Replicate from 'replicate'
import dotenv from 'dotenv'
dotenv.config()

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  userAgent: 'https://www.npmjs.com/package/create-replicate'
})
const model = 'kwaivgi/kling-v1.6-standard:304fbbf42962fd7934a542b9b11c67caa0488de224150f8f273d87079d163aff'
const input = {
  prompt: 'a portrait photo of a woman underwater with flowing hair',
  duration: 5,
  cfg_scale: 0.5,
  start_image: 'https://replicate.delivery/pbxt/MNRKHnYUu5HjNqEerj2kxWRmUD3xWGaZ0gJmhqVbkra2jCbD/underwater.jpeg',
  aspect_ratio: '16:9',
  negative_prompt: '',
}

console.log('Using model: %s', model)
console.log('With input: %O', input)

console.log('Running...')
const output = await replicate.run(model, { input })
console.log('Done!', output)
