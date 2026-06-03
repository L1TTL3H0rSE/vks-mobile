export function getRoomLink(roomId: string) {
  return `https://vcs.rguk.ru/rooms/${roomId}`;
}

export function mapS3Url(bucket: string, key: string) {
  return `https://s3.kosygin-rsu.ru/${bucket}/${key}`;
}
