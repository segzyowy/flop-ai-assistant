const INSTRUCTIONS='You are the user’s personal AI agent. Be helpful, clear, and honest. FLOP Testnet connectivity is not configured; do not claim that FLOP is connected, that the Testnet is live, or that this agent earns rewards.';

export function createOllamaAdapter(config,request=fetch){
  const history=[];
  return{
    configured:true,
    displayName:`Ollama local (${config.ollamaModel})`,
    async respond(text){
      const messages=[{role:'system',content:INSTRUCTIONS},...history,{role:'user',content:text}];
      let response;
      try{
        response=await request(`${config.ollamaBaseUrl}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.ollamaModel,messages,stream:false}),signal:AbortSignal.timeout(120000)});
      }catch{
        return`Could not reach local Ollama at ${config.ollamaBaseUrl}. Open Ollama and make sure the model ${config.ollamaModel} is downloaded.`;
      }
      let result;
      try{result=await response.json();}catch{return'Ollama returned an unreadable response. Please try again.';}
      if(!response.ok){
        const message=String(result?.error??'');
        if(response.status===404||/not found/i.test(message))return`Ollama cannot find ${config.ollamaModel}. In PowerShell, run: ollama pull ${config.ollamaModel}`;
        return`Local Ollama request failed (HTTP ${response.status}). Check that Ollama is running.`;
      }
      const answer=result?.choices?.[0]?.message?.content?.trim();
      if(!answer)return'Ollama returned no text. Please try again.';
      history.push({role:'user',content:text},{role:'assistant',content:answer});
      if(history.length>20)history.splice(0,history.length-20);
      return answer;
    }
  };
}
