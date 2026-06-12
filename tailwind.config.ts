import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 운영 상태 라벨 색상 (긴급/주의/정상/확인필요/승인필요)
        urgent: "#dc2626", // 긴급
        warn: "#d97706", // 주의
        ok: "#059669", // 정상
        check: "#2563eb", // 확인필요
        approve: "#7c3aed", // 승인필요
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
