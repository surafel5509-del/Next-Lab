import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TrainingManager from "./training-manager";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims) redirect("/login");
  const userId = String(claims.claims.sub);
  const { data: workspaces } = await supabase.from("workspaces").select("id,name").order("created_at").limit(1);
  const workspace = workspaces?.[0];
  if (!workspace) redirect("/workspace");

  const [{ data: models }, { data: datasets }, { data: jobs }] = await Promise.all([
    supabase.from("models").select("id,name,base_model,task,status").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
    supabase.from("datasets").select("id,name,file_name,status,storage_path").eq("workspace_id", workspace.id).eq("status", "ready").order("created_at", { ascending: false }),
    supabase.from("training_jobs").select("id,model_id,dataset_id,status,config,created_at,completed_at,error_message").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const downloadableDatasets = await Promise.all((datasets ?? []).map(async (dataset) => {
    if (!dataset.storage_path) return { ...dataset, downloadUrl: null };
    const { data } = await supabase.storage.from("dataset-uploads").createSignedUrl(dataset.storage_path, 3600, { download: dataset.file_name ?? true });
    return { ...dataset, downloadUrl: data?.signedUrl ?? null };
  }));

  return <main style={{minHeight:"100vh",background:"#090b10",color:"#f3f5fa",padding:"28px 20px",fontFamily:"DM Sans,sans-serif"}}>
    <div style={{maxWidth:1050,margin:"0 auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #242a37",paddingBottom:18}}>
        <Link href="/workspace" style={{fontWeight:700,fontSize:19}}>NEXT<span style={{color:"#a99cff"}}>LAB</span></Link>
        <Link href="/workspace" style={{color:"#a99cff",fontSize:13}}>← Workspace</Link>
      </header>
      <section style={{marginTop:38}}>
        <p style={{fontSize:11,letterSpacing:2,color:"#a99cff"}}>MODEL TRAINING · FREE KAGGLE GPU</p>
        <h1 style={{fontSize:32,margin:"8px 0"}}>Training jobs</h1>
        <p style={{color:"#929bad",fontSize:14}}>Create a training record and run a small LoRA fine-tuning experiment manually on Kaggle's free GPU quota.</p>
        <TrainingManager workspaceId={workspace.id} userId={userId} models={models ?? []} datasets={downloadableDatasets} initialJobs={jobs ?? []}/>
      </section>
    </div>
  </main>;
}
