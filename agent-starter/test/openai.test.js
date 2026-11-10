import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenAIAdapter} from '../src/adapters/openai.js';
import {createOllamaAdapter} from '../src/adapters/ollama.js';

test('OpenAI adapter sends a Responses API request and keeps session context locally',async()=>{
  const calls=[];
  const request=async(url,options)=>{calls.push({url,options,body:JSON.parse(options.body)});return{ok:true,status:200,json:async()=>({output_text:`reply ${calls.length}`})};};
  const adapter=createOpenAIAdapter({openaiApiKey:'test-key',openaiModel:'gpt-test'},request);
  assert.equal(await adapter.respond('hello'),'reply 1');
  assert.equal(await adapter.respond('follow up'),'reply 2');
  assert.equal(calls[0].url,'https://api.openai.com/v1/responses');
  assert.equal(calls[0].options.headers.Authorization,'Bearer test-key');
  assert.equal(calls[0].body.store,false);
  assert.deepEqual(calls[1].body.input.map(x=>x.role),['user','assistant','user']);
});

test('OpenAI adapter does not make a request without a key',async()=>{
  let called=false;
  const adapter=createOpenAIAdapter({openaiApiKey:'',openaiModel:'gpt-test'},async()=>{called=true;});
  assert.match(await adapter.respond('hello'),/not configured/);
  assert.equal(called,false);
});

test('OpenAI adapter explains a depleted API credit balance',async()=>{
  const adapter=createOpenAIAdapter({openaiApiKey:'test-key',openaiModel:'gpt-test'},async()=>({ok:false,status:429,json:async()=>({error:{code:'credit_balance_exhausted'}})}));
  assert.match(await adapter.respond('hello'),/credits are exhausted/);
});

test('local Ollama adapter uses the local server without sending an API key',async()=>{
  let call;
  const adapter=createOllamaAdapter({ollamaBaseUrl:'http://localhost:11434/v1',ollamaModel:'llama3.2:1b'},async(url,options)=>{call={url,options,body:JSON.parse(options.body)};return{ok:true,status:200,json:async()=>({choices:[{message:{content:'local reply'}}]})};});
  assert.equal(await adapter.respond('hello'),'local reply');
  assert.equal(call.url,'http://localhost:11434/v1/chat/completions');
  assert.equal(call.options.headers.Authorization,undefined);
  assert.equal(call.body.model,'llama3.2:1b');
});
