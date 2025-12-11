;; daily-checkin
;; Daily check-in dengan Clarity 4 (stacks-block-time) + streak + reset kalau skip.

(define-constant ONE-DAY u86400)          ;; 24 jam dalam detik
(define-constant CHECKIN_WINDOW u86400)   ;; minimal 24 jam antar check-in
(define-constant ERR_TOO_SOON (err u1000))

(define-map user-checkins
  principal
  {
    last-time: uint,   ;; timestamp blok terakhir checkin
    last-day: uint,    ;; indeks hari terakhir checkin (/ last-time ONE-DAY)
    total: uint,       ;; total semua checkin
    streak: uint       ;; streak berjalan
  }
)

(define-public (checkin)
  (let (
        (now stacks-block-time)
        (current (map-get? user-checkins tx-sender))
       )
    (match current

      ;; user sudah pernah check-in
      value
      (let (
            (last-time (get last-time value))
            (last-day  (get last-day value))
            (total     (get total value))
            (streak    (get streak value))
           )
        (if (>= (- now last-time) CHECKIN_WINDOW)
            (let (
                  (time-diff (- now last-time))
                  (new-total (+ total u1))
                  (new-streak
                    (if (and (>= time-diff ONE-DAY) (< time-diff (* ONE-DAY u2)))
                        ;; antara 1 dan <2 hari anggap hari berturut-turut
                        (+ streak u1)
                        ;; kalau hari reset streak
                        u1
                    )
                  )
                  (today (/ now ONE-DAY))
                 )
              (begin
                (map-set user-checkins tx-sender {
                  last-time: now,
                  last-day:  today,
                  total:     new-total,
                  streak:    new-streak
                })
                (ok {
                  total:     new-total,
                  streak:    new-streak,
                  last-time: now,
                  last-day:  today
                })
              )
            )
            ERR_TOO_SOON
        )
      )

      ;; none -> first time check-in
      (let (
            (today (/ now ONE-DAY))
           )
        (begin
          (map-set user-checkins tx-sender {
            last-time: now,
            last-day:  today,
            total:     u1,
            streak:    u1
          })
          (ok {
            total:     u1,
            streak:    u1,
            last-time: now,
            last-day:  today
          })
        )
      )
    )
  )
)

(define-read-only (get-my-checkin)
  (map-get? user-checkins tx-sender)
)

(define-read-only (get-user-checkin (user principal))
  (map-get? user-checkins user)
)
