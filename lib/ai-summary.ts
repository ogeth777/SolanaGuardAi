import { SecurityReport } from "./solana";

export function generateRiskSummary(report: SecurityReport): string {
  const risks: string[] = [];
  const pros: string[] = [];

  if (report.isMintable) risks.push("Mint Authority is still enabled (developer can print infinite tokens).");
  else pros.push("Mint Authority is revoked (supply is fixed).");

  if (report.isFreezable) risks.push("Freeze Authority is enabled (developer can blacklist wallets).");
  else pros.push("Freeze Authority is revoked (wallets cannot be frozen).");

  if (report.isMutable) risks.push("Metadata is mutable (developer can change token name/image).");
  else if (report.isMutable === false) pros.push("Metadata is immutable.");

  const top1 = report.topHolders[0]?.percentage || 0;
  if (top1 > 30) risks.push(`Whale alert: Top holder owns ${top1.toFixed(1)}% of supply.`);
  else pros.push("Holder distribution looks healthy (no single whale > 30%).");

  if (report.marketData) {
     if (report.marketData.liquidityUsd < 1000) risks.push("Very low liquidity (< $1,000). High volatility risk.");
     else if (report.marketData.liquidityUsd > 100000) pros.push("Deep liquidity (> $100k).");
  } else {
    risks.push("No liquidity found on major DEXes.");
  }

  let summary = `**AI Analysis Verdict: ${report.verdict}** (Risk Score: ${report.riskScore}/100)\n\n`;
  
  if (risks.length > 0) {
    summary += "⚠️ **Key Risks:**\n" + risks.map(r => `- ${r}`).join("\n") + "\n\n";
  }
  
  if (pros.length > 0) {
    summary += "✅ **Safety Signals:**\n" + pros.map(p => `- ${p}`).join("\n");
  }

  return summary;
}
