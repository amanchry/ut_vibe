import { Box, Flex } from "@radix-ui/themes";
import Image from "next/image";

function AuthLayout({ children }) {
  return (
    <div className="!bg-[#FCFCFD] min-h-screen w-full">
      <Flex gap="3" align="center" className="w-full flex-col sm:flex-row">
        <Box
          className="min-h-screen relative w-full sm:w-1/2"
          display={{ initial: "none", sm: "block" }}
        >
          <Image
            src="/images/AuthImage.jpg"
            alt="bg"
            fill
            className="object-cover object-top"
          />

        </Box>

        <Box className="w-full sm:w-1/2 flex items-center justify-center">
          {children}
        </Box>

      </Flex>
    </div>
  );
}

export default AuthLayout;
