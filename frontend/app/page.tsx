import { redirect } from "next/navigation";
import { getCurrentUser } from "./actions";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/todos" : "/login");
}
