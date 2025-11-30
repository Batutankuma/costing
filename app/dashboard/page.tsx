import type { Metadata } from "next";

import { Chart01 } from "@/components/chart-01";
import { Chart02 } from "@/components/chart-02";
import { Chart03 } from "@/components/chart-03";
import { Chart04 } from "@/components/chart-04";
import { Chart05 } from "@/components/chart-05";
import { Chart06 } from "@/components/chart-06";

export default function Page() {
  return (
    <div className="px-4 md:px-6 lg:px-8 @container">
      <div className="w-full max-w-6xl mx-auto">
        {/* Dynamic AppBar now provided in layout */}
        <div className="overflow-hidden">
          <div className="grid auto-rows-min @2xl:grid-cols-2 *:-ms-px *:-mt-px -m-px">
            <Chart01 />
            <Chart02 />
            <Chart03 />
            <Chart04 />
            <Chart05 />
            <Chart06 />
          </div>
        </div>
      </div>
    </div>
  );
}
