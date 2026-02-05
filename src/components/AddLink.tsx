import Link from "next/link";
import { LuPlus } from "react-icons/lu";

export function AddLink() {
  return (
    <Link
      href="/add"
      className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5 transition-colors"
      title="Add"
    >
      <LuPlus className="w-5 h-5" />
    </Link>
  );
}
