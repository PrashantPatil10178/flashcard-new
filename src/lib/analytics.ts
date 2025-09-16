import ReactGA from "react-ga4";

const MEASUREMENT_ID = "G-Z6WKJLV2RY";

export const initGA = () => {
  if (process.env.NODE_ENV === "production") {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

export const trackPageView = (path: string) => {
  if (process.env.NODE_ENV === "production") {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};

export const trackEvent = (
  category: string,
  action: string,
  label?: string
) => {
  if (process.env.NODE_ENV === "production") {
    ReactGA.event({
      category,
      action,
      label,
    });
  }
};
