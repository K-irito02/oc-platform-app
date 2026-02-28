import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import router from '@/router'
import theme from '@/theme/antdTheme'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setUser, logout } from '@/store/slices/authSlice'
import { fetchSiteConfig } from '@/store/slices/siteConfigSlice'
import { userApi } from '@/utils/api'
import { ThemeProvider } from '@/components/ThemeProvider'
import AntdStaticFunctions from '@/utils/antdUtils'

function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  // 加载站点配置
  useEffect(() => {
    dispatch(fetchSiteConfig())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated && !user) {
      userApi.getProfile()
        .then((res: any) => {
          if (res.data) dispatch(setUser(res.data))
        })
        .catch(() => dispatch(logout()))
    }
  }, [isAuthenticated, user, dispatch])

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntdApp>
        <AntdStaticFunctions />
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
