import { env } from "@/config/env";

export function getRoomLink(roomId: string) {
  return `https://vcs.rguk.ru/rooms/${roomId}`;
}

export function mapS3Url(bucket: string, key: string) {
  return `${env.s3Url}/${bucket}/${key}`;
}
