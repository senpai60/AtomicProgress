import React from "react";

const PageWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <main className={`flex-1 p-6 ${className}`}>{children}</main>;
};

export default PageWrapper;
