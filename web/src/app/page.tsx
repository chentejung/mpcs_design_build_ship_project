import { AccountBar } from "./components/AccountBar";
import { Workbench } from "./workbench/Workbench";

export default function Home() {
  return (
    <>
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="font-semibold">Audit Workbench</span>
          <AccountBar />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Workbench />
      </main>
    </>
  );
}
