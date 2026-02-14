const isStaging =
  process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_IS_STAGING;
export default isStaging;
