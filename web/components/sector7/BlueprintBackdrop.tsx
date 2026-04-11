import Image from "next/image";

const BLUEPRINT_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA4TuG8gvxXygBPoTGcSiap1MHD9IpyHXYqlpnVvnO7_LymWCFuZuuU354xIoM4mWto8A4WTkEAE1mBGibObiP5g6292G2oy5XwfKbpVwiv4S-tAIowTzwjtl9KCVV4JtY1TVTYWx5T9sxQC-VVhryxGPRrqCOtll1XOoA2Ui04WQPSG19j6heaBShATofErzh9lm-M5x96cEdsB4hhqKPWrObd5cOlZGUfRTNxC6Dw7X9ESTj_sngGi4hA0jgnSgAD0ZvDqlVn9ZU";

export function BlueprintBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] opacity-5">
      <Image
        className="object-cover grayscale"
        src={BLUEPRINT_SRC}
        alt=""
        fill
        sizes="100vw"
        unoptimized
        priority={false}
      />
    </div>
  );
}
