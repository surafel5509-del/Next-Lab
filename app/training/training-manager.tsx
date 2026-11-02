"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Model = { id:string; name:string; base_model:string; task:string; status:string };
type Dataset = { id:string; name:string; file_name:string|null; status:string; downloadUrl:string|null };
type Job = { id:string; model_id:string; dataset_id:string|null; status:string; config:Record<string,unknown>; created_at:string; completed_at:string|null; error_message:string|null };
const rawNotebookUrl = "https://raw.githubusercontent.com/surafel5509-del/Next-Lab/main/notebooks/Next_Lab_Kaggle_Free_GPU_LoRA.ipynb";
const kaggleNewUrl = "https://www.kaggle.com/code/new";

export default function TrainingManager({workspaceId,userId,models,datasets,initialJobs}:{workspaceId:string;userId:string;models:Model[];datasets:Dataset[];initialJobs:Job[]}) {
  const [jobs,setJobs]=useState(initialJobs);
  const gpuModels=models.filter(m=>m.base_model==="distilgpt2");
  const [modelId,setModelId]=useState(gpuModels[0]?.id ?? "");
  const [datasetId,setDatasetId]=useState(datasets[0]?.id ?? "");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();
  const supabase=createClient();
  const selectedModel=gpuModels.find(m=>m.id===modelId);
  const selectedDataset=datasets.find(d=>d.id===datasetId);

  async function createJob() {
    if(!modelId || !datasetId){setMessage("Choose a distilgpt2 model and a ready dataset first.");return;}
    if(!selectedDataset?.downloadUrl){setMessage("This dataset has no download link. Refresh the page or upload it again.");return;}
    setBusy(true);setMessage("");
    const {data,error}=await supabase.from("training_jobs").insert({
      workspace_id:workspaceId,model_id:modelId,dataset_id:datasetId,created_by:userId,
      config:{training_mode:"gpu",method:"lora",runner:"kaggle-free-gpu-manual",base_model:"distilgpt2",epochs:1,batch_size:2,max_length:256,max_steps:100,learning_rate:0.0001,run_state:"awaiting_manual_kaggle_run",note:"Job record only. Start Kaggle manually; do not mark complete until adapter is verified and imported."}
    }).select("id,model_id,dataset_id,status,config,created_at,completed_at,error_message").single();
    setBusy(false);
    if(error || !data){setMessage(error?.message ?? "Could not create the training job.");return;}
    setJobs(current=>[data,...current]);setMessage("Training job record created. Open Kaggle and start the notebook manually.");router.refresh();
  }

  return <div style={{display:"grid",gap:18,marginTop:26}}>
    <section style={panel}>
      <h2 style={{fontSize:15,margin:"0 0 7px"}}>Start a free Kaggle GPU experiment</h2>
      <p style={{fontSize:12,color:"#929bad",lineHeight:1.7,margin:"0 0 16px"}}>Next Lab records the job and prepares your dataset link. You start training in your own Kaggle account using its free GPU quota. No paid compute is activated.</p>
      {!gpuModels.length || !datasets.length ? <p style={{fontSize:12,color:"#e7c078"}}>You need a model with base model <code>distilgpt2</code> and one ready dataset. Create them in <a href="/models" style={{color:"#a99cff"}}>Models</a> and <a href="/datasets" style={{color:"#a99cff"}}>Datasets</a>.</p> : <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          <label style={label}>Model<select value={modelId} onChange={e=>setModelId(e.target.value)} style={field}>{gpuModels.map(m=><option key={m.id} value={m.id}>{m.name} · {m.base_model}</option>)}</select></label>
          <label style={label}>Training dataset<select value={datasetId} onChange={e=>setDatasetId(e.target.value)} style={field}>{datasets.map(d=><option key={d.id} value={d.id}>{d.name} ({d.file_name ?? "file"})</option>)}</select></label>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}>
          <button disabled={busy} onClick={createJob} style={primary}>{busy?"Creating…":"Create GPU training job"}</button>
          <a href={rawNotebookUrl} style={secondary}>Download Kaggle notebook ↓</a>
          <a href={kaggleNewUrl} target="_blank" rel="noreferrer" style={secondary}>Open Kaggle ↗</a>
          {selectedDataset?.downloadUrl && <a href={selectedDataset.downloadUrl} style={secondary}>Download selected dataset ↓</a>}
        </div>
        <ol style={{fontSize:12,color:"#aeb6c5",lineHeight:1.9,paddingLeft:20,margin:"14px 0 0"}}>
          <li>Download the notebook file, then open Kaggle and create a new Notebook.</li>
          <li>In Kaggle, use <b>File → Import Notebook</b> and upload the downloaded .ipynb.</li>
          <li>In Notebook Settings, select <b>GPU</b> and enable Internet; use only free quota.</li>
          <li>Paste the selected dataset's signed URL into the first data cell, then run cells from top to bottom.</li>
          <li>Download <code>next-lab-lora-adapter.zip</code> from Kaggle Output files after training.</li>
        </ol>
        <p style={{fontSize:11,color:"#e7c078",lineHeight:1.6}}>The dataset URL is temporary (about 1 hour). Create it shortly before starting Kaggle. Never paste a Supabase service-role key into Kaggle.</p>
        {message&&<p role="status" style={{fontSize:12,color:message.includes("created")?"#67dcb7":"#f0b56b"}}>{message}</p>}
      </>}
    </section>
    <section style={{...panel,padding:0,overflow:"hidden"}}>
      <div style={{padding:"17px 20px",borderBottom:"1px solid #293040",display:"flex",justifyContent:"space-between"}}><h2 style={{fontSize:14,margin:0}}>Training history</h2><span style={{fontSize:11,color:"#929bad"}}>{jobs.length} jobs</span></div>
      {!jobs.length?<p style={{padding:22,color:"#929bad",fontSize:13}}>No training jobs yet.</p>:jobs.map(job=>{
        const model=models.find(m=>m.id===job.model_id);const dataset=datasets.find(d=>d.id===job.dataset_id);const manual=job.config?.runner==="kaggle-free-gpu-manual";
        return <article key={job.id} style={{padding:"16px 20px",borderBottom:"1px solid #222a38"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><strong style={{fontSize:13}}>{model?.name??"Model"}</strong><p style={{fontSize:11,color:"#929bad",margin:"5px 0"}}>{dataset?.name??"Dataset"} · {new Date(job.created_at).toLocaleString()}</p></div><span style={{fontSize:10,color:job.status==="succeeded"?"#67dcb7":"#e7c078"}}>{job.status}{manual?" · manual Kaggle GPU run":""}</span></div>
          {manual&&<p style={{fontSize:11,color:"#929bad",margin:"8px 0 0"}}>Record only — Kaggle training is not confirmed by Next Lab. Keep this job pending until its adapter is imported and verified.</p>}
        </article>;
      })}
    </section>
    <section style={{...panel,borderColor:"#39415a"}}>
      <h2 style={{fontSize:14,margin:"0 0 8px"}}>Starter GPU configuration</h2>
      <p style={{fontSize:12,color:"#aeb6c5",lineHeight:1.8,margin:0}}>Base model: distilgpt2 (~82M parameters) · LoRA · max 100 steps · batch size 2 · sequence length 256. Kaggle's GPU type, free quota, and session duration vary.</p>
      <p style={{fontSize:12,color:"#67dcb7",margin:"10px 0 0"}}>Compute budget: $0 — free Kaggle quota only. No paid upgrade is triggered.</p>
    </section>
  </div>;
}
const panel:React.CSSProperties={background:"#121722",border:"1px solid #293040",borderRadius:14,padding:20};
const label:React.CSSProperties={display:"grid",gap:7,fontSize:12,color:"#aeb6c5"};
const field:React.CSSProperties={width:"100%",background:"#0b0f17",border:"1px solid #30394a",borderRadius:8,color:"#f3f5fa",padding:"11px 12px",fontSize:12};
const primary:React.CSSProperties={background:"#8978f5",border:0,borderRadius:8,color:"#fff",padding:"10px 16px",fontWeight:700,cursor:"pointer"};
const secondary:React.CSSProperties={background:"#171b26",border:"1px solid #394257",borderRadius:8,color:"#c7c0ff",padding:"10px 14px",fontSize:12,textDecoration:"none"};
