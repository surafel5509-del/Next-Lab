"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Dataset = {
  id: string; name: string; file_name: string | null; mime_type: string | null;
  size_bytes: number | null; status: "uploading" | "ready" | "failed";
  created_at: string; storage_path: string | null; downloadUrl: string | null;
};

const allowed = new Set(["csv", "json", "jsonl", "txt", "parquet"]);
const mimeByExt: Record<string,string> = {
  csv: "text/csv", json: "application/json", jsonl: "application/jsonl",
  txt: "text/plain", parquet: "application/x-parquet",
};
const maxBytes = 5 * 1024 * 1024;

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DatasetManager({ workspaceId, initialDatasets }: { workspaceId: string; initialDatasets: Dataset[] }) {
  const router = useRouter();
  const [datasets, setDatasets] = useState(initialDatasets);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function upload() {
    if (!file) { setMessage("Choose a dataset file first."); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowed.has(ext)) { setMessage("Supported formats: CSV, JSON, JSONL, TXT, Parquet."); return; }
    if (file.size > maxBytes) { setMessage("This upload flow currently supports files up to 5 MB."); return; }
    setBusy(true); setMessage("");
    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${workspaceId}/${id}/${safeName}`;
    const datasetName = name.trim() || file.name.replace(/\.[^.]+$/, "");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusy(false); setMessage("Your session expired. Please sign in again."); return; }

    const { data: record, error: insertError } = await supabase.from("datasets").insert({
      workspace_id: workspaceId, name: datasetName, file_name: file.name,
      mime_type: mimeByExt[ext], size_bytes: file.size, storage_path: storagePath,
      status: "uploading", created_by: auth.user.id,
    }).select("id").single();

    if (insertError || !record) { setBusy(false); setMessage(insertError?.message ?? "Could not create dataset record."); return; }

    const { error: uploadError } = await supabase.storage.from("dataset-uploads").upload(storagePath, file, {
      contentType: mimeByExt[ext], upsert: false,
    });
    if (uploadError) {
      await supabase.from("datasets").update({ status: "failed" }).eq("id", record.id);
      setBusy(false); setMessage(uploadError.message); router.refresh(); return;
    }
    const { error: updateError } = await supabase.from("datasets").update({ status: "ready" }).eq("id", record.id);
    if (updateError) {
      setBusy(false); setMessage("File uploaded, but its dataset record needs a status refresh. Contact support if it remains pending.");
      router.refresh(); return;
    }
    setName(""); setFile(null); setBusy(false); setMessage("Dataset uploaded successfully.");
    const { data: signed } = await supabase.storage.from("dataset-uploads").createSignedUrl(storagePath, 300, { download: file.name });
    setDatasets((current) => [{
      id: record.id, name: datasetName, file_name: file.name, mime_type: mimeByExt[ext],
      size_bytes: file.size, status: "ready", created_at: new Date().toISOString(),
      storage_path: storagePath, downloadUrl: signed?.signedUrl ?? null,
    }, ...current]);
    router.refresh();
  }

  return <div style={{display:"grid",gap:18,marginTop:26}}>
    <section style={{background:"#121722",border:"1px solid #293040",borderRadius:14,padding:20}}>
      <h2 style={{fontSize:15,margin:"0 0 7px"}}>Upload a dataset</h2>
      <p style={{fontSize:12,color:"#929bad",margin:"0 0 17px"}}>Private workspace storage · CSV, JSON, JSONL, TXT, or Parquet · Max 5 MB per file in this upload flow</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
        <label style={{display:"grid",gap:7,fontSize:12,color:"#aeb6c5"}}>Dataset name
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Customer support conversations" style={fieldStyle}/>
        </label>
        <label style={{display:"grid",gap:7,fontSize:12,color:"#aeb6c5"}}>Dataset file
          <input type="file" accept=".csv,.json,.jsonl,.txt,.parquet" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} style={{...fieldStyle,padding:9}}/>
        </label>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14,marginTop:15,flexWrap:"wrap"}}>
        <button onClick={upload} disabled={busy || !file} style={{background:"#8978f5",border:0,borderRadius:8,color:"#fff",padding:"10px 16px",fontWeight:700,opacity:busy||!file?.size?0.55:1,cursor:busy?"wait":"pointer"}}>{busy?"Uploading…":"Upload dataset"}</button>
        {file && <span style={{fontSize:11,color:"#929bad"}}>{file.name} · {formatSize(file.size)}</span>}
      </div>
      {message && <p role="status" style={{fontSize:12,color:message.includes("successfully")?"#67dcb7":"#f0b56b",margin:"13px 0 0"}}>{message}</p>}
    </section>
    <section style={{background:"#121722",border:"1px solid #293040",borderRadius:14,overflow:"hidden"}}>
      <div style={{padding:"17px 20px",borderBottom:"1px solid #293040",display:"flex",justifyContent:"space-between"}}><h2 style={{fontSize:14,margin:0}}>Your datasets</h2><span style={{fontSize:11,color:"#929bad"}}>{datasets.length} total</span></div>
      {datasets.length===0 ? <p style={{padding:22,color:"#929bad",fontSize:13}}>No datasets yet. Upload your first training file above.</p> : datasets.map((dataset)=>(
        <div key={dataset.id} style={{padding:"15px 20px",borderBottom:"1px solid #222a38",display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{minWidth:0}}><strong style={{fontSize:13}}>{dataset.name}</strong><div style={{fontSize:11,color:"#929bad",marginTop:5}}>{dataset.file_name} · {formatSize(dataset.size_bytes)} · {new Date(dataset.created_at).toLocaleDateString()}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:10,color:dataset.status==="ready"?"#67dcb7":dataset.status==="failed"?"#f08b8b":"#e7c078"}}>{dataset.status}</span>{dataset.downloadUrl && <a href={dataset.downloadUrl} style={{fontSize:11,color:"#a99cff"}}>Download</a>}</div>
        </div>
      ))}
    </section>
  </div>;
}

const fieldStyle: React.CSSProperties = {width:"100%",background:"#0b0f17",border:"1px solid #30394a",borderRadius:8,color:"#f3f5fa",padding:"11px 12px",fontSize:12};
