import { useEffect, useMemo } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import router from '@/router'
import theme from '@/theme/antdTheme'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setUser, logout } from '@/store/slices/authSlice'
import { fetchSiteConfig } from '@/store/slices/siteConfigSlice'
import { userApi } from '@/utils/api'
import { ThemeProvider } from '@/components/ThemeProvider'
import { useAntdStaticFunctions } from '@/utils/antdUtils'
import { useTranslation } from 'react-i18next'
import { useFavicon } from '@/hooks/useFavicon'

type UserProfile = {
  id: number
  username: string
  email: string
  avatarUrl: string | null
  roles: string[]
  themeConfig?: string
}

type ApiResponse<T> = {
  data: T
}

function AntdInitializer() {
  useAntdStaticFunctions()
  return null
}

function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const { i18n } = useTranslation()
  
  useFavicon()

  const antdLocale = useMemo(() => {
    switch (i18n.language) {
      case 'en-US':
        return enUS
      case 'zh-CN':
      default:
        return zhCN
    }
  }, [i18n.language])

  // 加载站点配置
  useEffect(() => {
    dispatch(fetchSiteConfig())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated && !user) {
      userApi.getProfile()
        .then((res) => {
          const data = (res as ApiResponse<UserProfile>).data
          if (data) dispatch(setUser(data))
        })
        .catch(() => dispatch(logout()))
    }
  }, [isAuthenticated, user, dispatch])

  return (
    <ConfigProvider locale={antdLocale} theme={theme}>
      <AntdApp>
        <AntdInitializer />
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
