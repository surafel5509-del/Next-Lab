import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ModelManager from "./model-manager";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims) redirect("/login");
  const { data: workspaces } = await supabase.from("workspaces").select("id,name").order("created_at").limit(1);
  const workspace = workspaces?.[0];
  if (!workspace) redirect("/workspace");
  const { data: models } = await supabase.from("models")
    .select("id,name,description,base_model,task,status,latest_version,created_at")
    .eq("workspace_id", workspace.id).order("created_at", { ascending: false });
  return <main style={{minHeight:"100vh",background:"#090b10",color:"#f3f5fa",padding:"28px 20px",fontFamily:"DM Sans,sans-serif"}}>
    <div style={{maxWidth:1050,margin:"0 auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #242a37",paddingBottom:18}}>
        <Link href="/workspace" style={{fontWeight:700,fontSize:19}}>NEXT<span style={{color:"#a99cff"}}>LAB</span></Link>
        <Link href="/workspace" style={{color:"#a99cff",fontSize:13}}>← Workspace</Link>
      </header>
      <section style={{marginTop:38}}>
        <p style={{fontSize:11,letterSpacing:2,color:"#a99cff"}}>MODEL DEVELOPMENT</p>
        <h1 style={{fontSize:32,margin:"8px 0"}}>Model registry</h1>
        <p style={{color:"#929bad",fontSize:14}}>Create and configure model projects in {workspace.name}. Model creation does not start GPU training.</p>
        <ModelManager workspaceId={workspace.id} initialModels={models ?? []}/>
      </section>
    </div>
  </main>;
}
