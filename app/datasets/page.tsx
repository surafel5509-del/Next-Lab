import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DatasetManager from "./dataset-manager";

export const dynamic = "force-dynamic";

export default async function DatasetsPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims) redirect("/login");

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id,name")
    .order("created_at", { ascending: true })
    .limit(1);
  const workspace = workspaces?.[0];
  if (!workspace) {
    return <main style={{minHeight:"100vh",background:"#090b10",color:"#f3f5fa",padding:32,fontFamily:"DM Sans,sans-serif"}}>
      <Link href="/workspace" style={{color:"#a99cff"}}>← Workspace</Link>
      <h1>Datasets</h1><p>Your account does not have a workspace yet. Confirm your email and sign in again.</p>
    </main>;
  }

  const { data: datasets } = await supabase
    .from("datasets")
    .select("id,name,file_name,mime_type,size_bytes,status,created_at,storage_path")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const rows = await Promise.all((datasets ?? []).map(async (dataset) => {
    if (!dataset.storage_path || dataset.status !== "ready") return { ...dataset, downloadUrl: null };
    const { data } = await supabase.storage.from("dataset-uploads").createSignedUrl(dataset.storage_path, 300, { download: dataset.file_name ?? true });
    return { ...dataset, downloadUrl: data?.signedUrl ?? null };
  }));

  return <main style={{minHeight:"100vh",background:"#090b10",color:"#f3f5fa",padding:"28px 20px",fontFamily:"DM Sans,sans-serif"}}>
    <div style={{maxWidth:1050,margin:"0 auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,borderBottom:"1px solid #242a37",paddingBottom:18}}>
        <Link href="/workspace" style={{fontWeight:700,fontSize:19}}>NEXT<span style={{color:"#a99cff"}}>LAB</span></Link>
        <Link href="/workspace" style={{color:"#a99cff",fontSize:13}}>← Workspace</Link>
      </header>
      <section style={{marginTop:38}}>
        <p style={{fontSize:11,letterSpacing:2,color:"#a99cff"}}>DATA MANAGEMENT</p>
        <h1 style={{fontSize:32,margin:"8px 0"}}>Datasets</h1>
        <p style={{color:"#929bad",fontSize:14}}>Upload and manage private training datasets in {workspace.name}.</p>
        <DatasetManager workspaceId={workspace.id} initialDatasets={rows} />
      </section>
    </div>
  </main>;
}
