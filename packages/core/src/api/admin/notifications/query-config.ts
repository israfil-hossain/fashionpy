export const notificationFeedFields = [
  "id",
  "recipient_type",
  "recipient_id",
  "seller_id",
  "event",
  "title",
  "body",
  "link",
  "resource_type",
  "resource_id",
  "data",
  "read_at",
  "created_at",
  "updated_at",
]

export const notificationFeedQueryConfig = {
  list: {
    defaults: notificationFeedFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: notificationFeedFields,
    isList: false,
  },
}
