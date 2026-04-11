import Link from "next/link";

export function SoluterLogo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
        <span className="text-sm font-bold text-primary-foreground">S</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          DOBROW Academy
        </span>
        <span className="text-xs text-muted-foreground">
          AI career transitions
        </span>
      </div>
    </Link>
  );
}
