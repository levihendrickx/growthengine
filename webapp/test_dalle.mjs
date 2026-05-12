import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log('Key prefix:', process.env.OPENAI_API_KEY?.slice(0,20));
try {
  const resp = await client.images.generate({
    model: 'dall-e-3',
    prompt: 'sunny beach lifestyle photo',
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });
  console.log('OK:', resp.data[0].url.slice(0, 60));
} catch(e) {
  console.log('ERROR:', e.message.slice(0, 300));
}
