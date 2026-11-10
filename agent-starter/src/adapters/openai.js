const API_URL='https://api.openai.com/v1/responses';
const INSTRUCTIONS='You are the user’s personal AI agent. Be helpful, clear, and honest. FLOP Testnet connectivity is not configured; do not claim that FLOP is connected, that the Testnet is live, or that this agent earns rewards.';

export function createOpenAIAdapter(config,request=fetch){
  const history=[];
  return{
    configured:Boolean(config.openaiApiKey),
    async respond(text){
      if(!config.openaiApiKey)return'OpenAI is not configured. Add OPENAI_API_KEY to your local .env file and restart.';
      const input=[...history,{role:'user',content:text}];
      let response;
      try{
        response=await request(API_URL,{method:'POST',headers:{Authorization:`Bearer ${config.openaiApiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:config.openaiModel,instructions:INSTRUCTIONS,input,store:false}),signal:AbortSignal.timeout(60000)});
      }catch{
        return'Could not reach OpenAI. Check your internet connection and try again.';
      }
      let result;
      try{result=await response.json();}catch{return'OpenAI returned an unreadable response. Please try again.';}
      if(!response.ok){
        if(response.status===401)return'OpenAI rejected the API key. Check OPENAI_API_KEY in your local .env file.';
        if(response.status===429)return'OpenAI reports a usage limit or rate limit. Check your API project access and try again.';
        return`OpenAI request failed (HTTP ${response.status}). Check the model name in OPENAI_MODEL and your API access.`;
      }
      const answer=typeof result.output_text==='string'?result.output_text.trim():'';
      if(!answer)return'OpenAI returned no text. Please try again.';
      history.push({role:'user',content:text},{role:'assistant',content:answer});
      if(history.length>20)history.splice(0,history.length-20);
      return answer;
    }
  };
}
