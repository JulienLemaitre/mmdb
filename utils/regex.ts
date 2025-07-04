import { disposableEmailDomainList } from "./disposableEmailDomainList";

export const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
// const emailRegex = /^[a-zA-Z\d.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z\d-]+(?:\.[a-zA-Z\d-]+)*$/;

export const clientMaturityRegex = /^(48H|15D|30D|90D|>90D|NC)$/;
export const consoVolumeFloatRegex =
  /^\d+((?:\.|,)(?:0|00|000|25|250|5|50|500|75|750))?$/;
export const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const adminVolumeFloatRegex = /^\d+((?:\.|,)\d+){0,1}?$/;
export const floatRegex = /^\d+(\.\d+|,\d+)?$/;
export const phoneRegex = /^0[0-9]{9}$/;
export const mobileRegex = /^0[67][0-9]{8}$/;

export const emailOrEmptyRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))?$/;
export const phoneOrEmptyRegex = /^(0[0-9]{9})?$/;
export const mobileOrEmptyRegex = /^(0[67][0-9]{8})?$/;

export const excludedEmailDomain = new RegExp(
  "^((?!@(" + disposableEmailDomainList.join("|") + ")).)*$",
);

export const siretRegex = new RegExp(/^\d{14}$/);
export const bddTimeRegex =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/;
export const questionMarkRegex = /\?/g;
