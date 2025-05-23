/*
 * This file is part of the nivo project.
 *
 * Copyright 2016-present, Raphaël Benitte.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import PropTypes from "prop-types";
import { useMeasure } from "@/components/hooks/useMeasure";

const ResponsiveWrapper = ({ children }) => {
  const [measureRef, bounds] = useMeasure();
  const shouldRender = bounds.width > 0 && bounds.height > 0;

  return (
    <div
      ref={measureRef}
      style={{ width: "100%", height: "100%" }}
      className="relative"
    >
      {shouldRender &&
        children({
          width: bounds.width,
          height: bounds.height,
        })}
    </div>
  );
};

ResponsiveWrapper.propTypes = {
  children: PropTypes.func.isRequired,
};

export default ResponsiveWrapper;
