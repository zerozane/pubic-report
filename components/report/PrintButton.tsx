"use client";

import { FileDown } from "lucide-react";

type PrintButtonProps = {
  href?: string;
};

export default function PrintButton({ href }: PrintButtonProps) {
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        <FileDown size={15} />
        Export Summary
      </a>
    );
  }

  return (
    <button type="button" onClick={() => window.print()}>
      <FileDown size={15} />
      Export Summary
    </button>
  );
}
