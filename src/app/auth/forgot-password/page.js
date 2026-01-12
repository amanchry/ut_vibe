"use client";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import {
  ChevronLeftIcon,
  EyeClosedIcon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";
import OtpInput from "@/components/OtpInput";
import { useToast } from "@/provider/ToastContext";

function ForgotPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [otpError, setOtpError] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);
  const { showToast } = useToast();


  useEffect(() => {
    let timer;
    if (isResendDisabled && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendDisabled(false);
    }

    return () => clearTimeout(timer);
  }, [countdown, isResendDisabled]);

  // function to handle resending the code
  const handleResendCode = () => {
    // Reset the countdown and disable the button
    setCountdown(10);
    setIsResendDisabled(true);

    // Call your function to resend the OTP
    handleSendOtp({ email: userEmail });
  };

  const {
    register,
    handleSubmit,
    setValue, // Add this
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });

  const handleSendOtp = async (data) => {
    setIsLoading(true);
    try {
      // Generate OTP on frontend
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Send email with OTP
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          otp: otp,
        }),
      });

      const responseData = await response.json();
      if (responseData.success) {
        setUserEmail(data.email);
        setShowOtpField(true);
      } else {
        showToast("Failed to send verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (data) => {
    setIsLoading(true);
    setOtpError("");

    try {


      // Verify OTP locally
      if (String(data.otp) === String(generatedOtp)) {
        // OTP is correct, proceed to password creation
        setShowPasswordField(true);
      } else {
        // OTP is incorrect
        setOtpError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setOtpError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

const handleCreatePassword = async (data) => {

  setIsLoading(true);
  try {
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });



    if (res.data.success) {
      showToast("Password reset successful!");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1000);
    } else {
      showToast(res.data.message || "⚠️ Failed to reset password");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    showToast(
      error.res?.data?.message ||
        "Something went wrong. Please try again later."
    );
  } finally {
    setIsLoading(false);
  }
};


  const onSubmit = (data) => {
    if (!showOtpField) {
      handleSendOtp(data);
    } else if (!showPasswordField) {
      handleVerifyOtp(data);
    } else {
      handleCreatePassword(data);
    }
  };

  return (
    <>
      {!showOtpField ? (
        <Flex
          maxWidth="480px"
          direction="column"
          align="center"
          justify="center"
          className="mx-auto p-5"
          gap="8"
        >
          <Flex direction="column" gap="2" width="100%">
            <Text as="p" size="7" weight="light">
              Forgot your password? No worries! 😊
            </Text>
            <Text
              as="p"
              color="gray"
              size="3"
              className="my-10"
              weight="regular"
            >
              Drop your email and we'll send you a code to reset it. Easy peasy!
            </Text>
          </Flex>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <Flex direction="column" gap="6" width="100%">
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="2">
                  Email
                </Text>
                <TextField.Root
                  size="2"
                  placeholder="Enter email address"
                  variant={errors.email ? "soft" : "surface"}
                  color={errors.email ? "red" : undefined}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter the email id in correct format",
                    },
                  })}
                />
                <Flex height="20px" justify="start" align="center">
                  {errors.email && (
                    <Text color="red" size="1">
                      {errors.email.message}
                    </Text>
                  )}
                </Flex>
              </Flex>
              <Button
                type="submit"
                variant="solid"
                size="3"
                disabled={!isValid || isLoading}
              >
                {isLoading ? "Sending code..." : "Send me the code 📧"}
              </Button>
            </Flex>
          </form>
          <Flex gap="2">
            <Box>
              <Button
                variant="ghost"
                size="2"
                onClick={() => router.push("/auth/login")}
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back to Sign in
              </Button>
            </Box>
          </Flex>
        </Flex>
      ) : !showPasswordField ? (
        <Flex
          direction="row"
          align="start"
          justify="start"
          gap="2"
          maxWidth="480px"
          className="mx-auto p-5"
        >
          <Button
            mt="2"
            variant="ghost"
            size="2"
            color="gray"
            onClick={() => setShowOtpField(false)}
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </Button>
          <Flex
            width="100%"
            direction="column"
            align="center"
            justify="center"
            className="mx-auto"
            gap="8"
          >
            <Flex direction="column" width="100%" gap="2" align="start">
              <Text as="p" size="7" weight="regular">
                Enter verification code
              </Text>
              <Text
                as="p"
                color="gray"
                size="3"
                className="my-10"
                weight="light"
              >
                A verification code has been sent to
              </Text>
              <Text as="p" size="3" weight="regular" color="blue">
                {userEmail}
              </Text>
            </Flex>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full">
              <Flex direction="column" gap="6" width="100%">
                <Flex direction="column" gap="2">
                  <Text as="div" size="1" weight="medium" color="gray" pb="2">
                    Enter the 6-digit code
                  </Text>
                  <OtpInput
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    otpError={otpError}
                  />


                  <Flex height="20px" justify="start" align="center">
                    {errors.otp && errors.otp.type !== "required" && (
                      <Text color="red" size="1">
                        {errors.otp.message}
                      </Text>
                    )}
                    {otpError && !errors.otp && (
                      <Text color="red" size="1">
                        {otpError}
                      </Text>
                    )}
                  </Flex>
                </Flex>
                <Button
                  type="submit"
                  variant="solid"
                  size="3"
                  disabled={!isValid || isLoading}
                >
                  {isLoading ? "Checking..." : "Verify ✨"}
                </Button>
              </Flex>
            </form>
            <Flex gap="1">
              <Box>
                <Text as="p" size="2" weight="medium" color="gray">
                  Didn&apos;t receive an email?
                </Text>
              </Box>
              <Box>
                <Button
                  variant="ghost"
                  size="2"
                  onClick={handleResendCode}
                  disabled={isResendDisabled}
                  className={`${!isResendDisabled ? '!underline !underline-offset-2' : '!text-[#8B8D98]'} hover:!bg-transparent`}
                >
                  {isResendDisabled
                    ? `Resend code in ${countdown}s.`
                    : "Resend code."}
                </Button>
              </Box>
            </Flex>
          </Flex>
        </Flex>
      ) : (
        <Flex
          maxWidth="480px"
          direction="column"
          align="center"
          justify="center"
          className="mx-auto p-5"
          gap="8"
        >
          <Flex direction="column" width="100%" gap="2" align="start">
            <Text as="p" size="7" weight="regular">
              Create password
            </Text>
            <Text as="p" color="gray" size="3" className="my-10" weight="light">
              Your password must be at least 8 characters and include at least
              one special character
            </Text>
          </Flex>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex flex-col gap-8"
          >
            <Flex direction="column" gap="2" width="100%">
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="2">
                  Password
                </Text>
                <Box>
                  <TextField.Root
                    size="2"
                    placeholder="Create a new password"
                    variant={errors.password ? "soft" : "surface"}
                    className={`${
                      errors.password
                        ? "!bg-[#FBECEC] focus-within:!outline-[#DC4242]"
                        : "focus-within:!outline-[#3F7FC0] focus-within:!bg-transparent"
                    } mb-1`}
                    type={showPass ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                  >
                    <TextField.Slot side="right">
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPass(!showPass);
                        }}
                      >
                        {showPass ? (
                          <EyeOpenIcon height="14" width="14" />
                        ) : (
                          <EyeClosedIcon height="14" width="14" />
                        )}
                      </IconButton>
                    </TextField.Slot>
                  </TextField.Root>
                  <Flex height="20px" justify="start" align="center">
                    {errors.password && (
                      <Text className="text-[#DC4242] text-sm font-normal">
                        {errors.password.message}
                      </Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="2">
                  Confirm Password
                </Text>
                <Box>
                  <TextField.Root
                    size="2"
                    placeholder="Confirm password"
                    variant={errors.confirmPassword ? "soft" : "surface"}
                    className={`${
                      errors.confirmPassword
                        ? "!bg-[#FBECEC] focus-within:!outline-[#DC4242]"
                        : "focus-within:!outline-[#3F7FC0] focus-within:!bg-transparent"
                    } mb-1`}
                    type={showConfPass ? "text" : "password"}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value, formValues) =>
                        value === formValues.password ||
                        "Passwords do not match.",
                    })}
                  >
                    <TextField.Slot side="right">
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowConfPass(!showConfPass);
                        }}
                      >
                        {showConfPass ? (
                          <EyeOpenIcon height="14" width="14" />
                        ) : (
                          <EyeClosedIcon height="14" width="14" />
                        )}
                      </IconButton>
                    </TextField.Slot>
                  </TextField.Root>
                  <Flex height="20px" justify="start" align="center">
                    {errors.confirmPassword && (
                      <Text className="text-[#DC4242] text-sm font-normal">
                        {errors.confirmPassword.message}
                      </Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
            </Flex>
            <Button
              type="submit"
              variant="solid"
              size="3"
              disabled={!isValid || isLoading}
            >
                {isLoading ? "Resetting..." : "Reset password ✨"}
            </Button>
          </form>
          <Button
            variant="ghost"
            size="2"
            onClick={() => router.push("/auth/login")}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Sign in
          </Button>
        </Flex>
      )}
    </>
  );
}

export default ForgotPassword;
