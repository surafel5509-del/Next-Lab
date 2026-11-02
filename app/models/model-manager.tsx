"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Model = { id:string; name:string; description:string|null; base_model:string; task:string; status:string; latest_version:string|null; created_at:string };
const bases = ["meta-llama/Llama-3.2-1B","Qwen/Qwen2.5-1.5B","google/gemma-2-2b","microsoft/Phi-3.5-mini-instruct","custom"];

export default function ModelManager({workspaceId,initialModels}:{workspaceId:string;initialModels:Model[]}) {
  const [models,setModels]=useState(initialModels);
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [baseModel,setBaseModel]=useState(bases[0]);
  const [customBase,setCustomBase]=useState("");
  const [task,setTask]=useState("text-generation");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();
  const supabase=createClient();

  async function createModel() {
    const cleanName=name.trim();
    const selectedBase=baseModel==="custom"?customBase.trim():baseModel;
    if(!cleanName || !selectedBase){setMessage("Model name and base model are required.");return;}
    if(cleanName.length>80 || selectedBase.length>180){setMessage("Name or base model is too long.");return;}
    setBusy(true);setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setBusy(false);setMessage("Session expired. Sign in again.");return;}
    const {data,error}=await supabase.from("models").insert({
      workspace_id:workspaceId,name:cleanName,description:description.trim()||null,
      base_model:selectedBase,task,status:"draft",config:{created_via:"next-lab-dashboard"},created_by:user.id
    }).select("id,name,description,base_model,task,status,latest_version,created_at").single();
    setBusy(false);
    if(error || !data){setMessage(error?.message??"Could not create model.");return;}
    setModels(current=>[data,...current]);setName("");setDescription("");setMessage("Model project created.");
    router.refresh();
  }

  return <div style={{display:"grid",gap:18,marginTop:26}}>
    <section style={panel}>
      <h2 style={{fontSize:15,margin:"0 0 7px"}}>Create model project</h2>
      <p style={{fontSize:12,color:"#929bad",margin:"0 0 17px"}}>Register a base language model and task configuration. Training will be enabled when a secure worker is connected.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
        <label style={label}>Model name<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} placeholder="My support assistant" style={field}/></label>
        <label style={label}>Base model<select value={baseModel} onChange={e=>setBaseModel(e.target.value)} style={field}>{bases.map(b=><option key={b} value={b}>{b}</option>)}</select></label>
        <label style={label}>Task<select value={task} onChange={e=>setTask(e.target.value)} style={field}><option value="text-generation">Text generation</option><option value="text-classification">Text classification</option><option value="summarization">Summarization</option><option value="question-answering">Question answering</option></select></label>
        <label style={label}>Description<input value={description} onChange={e=>setDescription(e.target.value)} maxLength={500} placeholder="What will this model do?" style={field}/></label>
      </div>
      {baseModel==="custom"&&<label style={{...label,marginTop:12}}>Custom model identifier<input value={customBase} onChange={e=>setCustomBase(e.target.value)} placeholder="organization/model-name" style={field}/></label>}
      <button disabled={busy} onClick={createModel} style={{marginTop:16,background:"#8978f5",border:0,borderRadius:8,color:"#fff",padding:"10px 16px",fontWeight:700,opacity:busy?.6:1}}>{busy?"Creating…":"Create model"}</button>
      {message&&<p role="status" style={{fontSize:12,color:message.includes("created")?"#67dcb7":"#f0b56b"}}>{message}</p>}
    </section>
    <section style={{...panel,padding:0,overflow:"hidden"}}>
      <div style={{padding:"17px 20px",borderBottom:"1px solid #293040",display:"flex",justifyContent:"space-between"}}><h2 style={{fontSize:14,margin:0}}>Registered models</h2><span style={{fontSize:11,color:"#929bad"}}>{models.length} total</span></div>
      {!models.length?<p style={{padding:22,color:"#929bad",fontSize:13}}>No models registered. Create your first model above.</p>:models.map(m=><article key={m.id} style={{padding:"16px 20px",borderBottom:"1px solid #222a38",display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div><strong style={{fontSize:13}}>{m.name}</strong><p style={{fontSize:11,color:"#929bad",margin:"5px 0"}}>{m.base_model} · {m.task}</p>{m.description&&<p style={{fontSize:12,color:"#aeb6c5",margin:0}}>{m.description}</p>}</div>
        <span style={{fontSize:10,color:"#e7c078",alignSelf:"center"}}>{m.status}</span>
      </article>)}
    </section>
  </div>;
}
const panel:React.CSSProperties={background:"#121722",border:"1px solid #293040",borderRadius:14,padding:20};
const label:React.CSSProperties={display:"grid",gap:7,fontSize:12,color:"#aeb6c5"};
const field:React.CSSProperties={width:"100%",background:"#0b0f17",border:"1px solid #30394a",borderRadius:8,color:"#f3f5fa",padding:"11px 12px",fontSize:12};
