import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Map from "@/components/Map/Map";

import { Badge } from "@biltema-ui/global";

// import { Button } from "hannes-ui/components";

export default async function Dashboard() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="">
      {/* <h1 className="text-3xl font-bold mb-2">Välkommen {user.email} 👋</h1> */}
      <Map />

      {/* <Button
        label="Click me!"
        variant="solid"
        onClick={() => console.log("clicked")}
      /> */}
      <div>
        <h2>External Paketets TestComponent</h2>
        <Badge>Hej från External!</Badge>
      </div>
    </div>
  );
}
