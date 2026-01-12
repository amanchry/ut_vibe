import { Box, Flex } from "@radix-ui/themes";
import Image from "next/image";

function AuthLayout({ children }) {
  return (
    <div className="!bg-[#FCFCFD] min-h-screen">
      <Flex gap="3" align="center">
        <Box
          className="min-h-screen relative"
          display={{ initial: "none", sm: "block" }}
          width="50%"
        >
          <Image
            src="/images/AuthImage.jpg"
            alt="bg"
            fill
            className="object-cover object-top"
          />

        </Box>

        {children}

      </Flex>
    </div>
  );
}

export default AuthLayout;
